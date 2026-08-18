import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

export const SALON_WORKING_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
];

// ⏱️ GET REAL-TIME SLOT AVAILABILITY FOR DATE & STYLIST
export const getSlotAvailability = async (req, res) => {
  try {
    const { date, employee_id } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter (YYYY-MM-DD) is required.",
      });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Fetch all active appointments on the given day (exclude cancelled)
    const dayAppointments = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      service_status: { $ne: "cancelled" },
    }).lean();

    const activeEmployees = await Employee.find({ status: true }).lean();
    const totalStylistsCount = Math.max(activeEmployees.length, 1);

    const bookedSlotsSet = new Set();
    const slotCountMap = new Map();

    for (const app of dayAppointments) {
      const time = app.appointment_time?.trim();
      if (!time) continue;

      if (employee_id && employee_id !== "any") {
        // Check if this specific employee is booked on this appointment
        const hasEmp = (app.services || []).some(
          (s) => s.employee_id && s.employee_id.toString() === employee_id.toString()
        );
        if (hasEmp) {
          bookedSlotsSet.add(time);
        }
      } else {
        // General salon capacity check
        const currentCount = slotCountMap.get(time) || 0;
        slotCountMap.set(time, currentCount + 1);
        if (currentCount + 1 >= totalStylistsCount) {
          bookedSlotsSet.add(time);
        }
      }
    }

    const slots = SALON_WORKING_SLOTS.map((slot) => {
      const isBooked = bookedSlotsSet.has(slot);
      return {
        time: slot,
        available: !isBooked,
        reason: isBooked ? "Booked (Busy)" : "Available",
      };
    });

    const nextAvailable = slots.find((s) => s.available)?.time || null;
    const availableCount = slots.filter((s) => s.available).length;
    const bookedCount = slots.filter((s) => !s.available).length;

    res.status(200).json({
      success: true,
      date,
      employee_id: employee_id || "any",
      slots,
      nextAvailableSlot: nextAvailable,
      availableCount,
      bookedCount,
      totalSlots: SALON_WORKING_SLOTS.length,
    });
  } catch (err) {
    console.error("❌ Slot availability error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 📞 SEARCH CUSTOMER BY PHONE
export const searchCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const normalizedPhone = phone.replace(/\s+/g, "").replace(/\+91/, "");
    const customer = await Customer.findOne({
      $or: [
        { phone: normalizedPhone },
        { phone: `+91${normalizedPhone}` },
        { phone: { $regex: normalizedPhone } },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No existing customer found",
      });
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 📅 CREATE APPOINTMENT (With Conflict Detection & Service Status)
export const createAppointment = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      dob,
      address,
      note,
      source,
      services,
      date,
      appointment_time,
      service_status,
      payment_mode,
      confirmation_status,
      amount,
      employee_id,
    } = req.body;

    // Validate required fields
    if (!name || !phone || !services?.length) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and services are required",
      });
    }

    const appointmentDateStr = date ? date.split("T")[0] : new Date().toISOString().split("T")[0];
    const requestedTime = appointment_time || "11:00 AM";

    // 🔒 CONFLICT CHECK: Prevent double-booking for the same stylist on the same date & time slot
    let primaryEmpId = employee_id || services[0]?.employee_id || null;
    if (primaryEmpId && primaryEmpId !== "any") {
      const startOfDay = new Date(`${appointmentDateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${appointmentDateStr}T23:59:59.999Z`);

      const existingConflict = await Appointment.findOne({
        date: { $gte: startOfDay, $lte: endOfDay },
        appointment_time: requestedTime,
        service_status: { $ne: "cancelled" },
        "services.employee_id": primaryEmpId,
      });

      if (existingConflict) {
        // Calculate next available slot for this stylist
        const dayAppointments = await Appointment.find({
          date: { $gte: startOfDay, $lte: endOfDay },
          service_status: { $ne: "cancelled" },
          "services.employee_id": primaryEmpId,
        }).lean();

        const bookedSet = new Set(dayAppointments.map((a) => a.appointment_time?.trim()));
        const nextSlot = SALON_WORKING_SLOTS.find((s) => !bookedSet.has(s)) || "Tomorrow 10:00 AM";

        const empDoc = await Employee.findById(primaryEmpId);
        const empName = empDoc ? empDoc.name : "Selected stylist";

        return res.status(409).json({
          success: false,
          conflict: true,
          message: `${empName} is already booked at ${requestedTime}.`,
          nextAvailableSlot: nextSlot,
          suggestedMessage: `Next available slot with ${empName} is ${nextSlot}.`,
        });
      }
    }

    const normalizedPhone = phone.replace(/\s+/g, "");
    let customer = await Customer.findOne({
      $or: [{ phone: normalizedPhone }, { phone: normalizedPhone.replace(/\+91/, "") }],
    });

    // Create customer if not exists
    if (!customer) {
      customer = await Customer.create({
        name: name.trim(),
        email: email ? email.trim() : "",
        phone: normalizedPhone,
        gender: gender || "other",
        dob: dob || null,
        address: address || "",
        source: source || "walk-in",
      });
    } else {
      if (name && customer.name !== name) customer.name = name;
      if (email && !customer.email) customer.email = email;
      if (gender && (!customer.gender || customer.gender === "other")) customer.gender = gender;
      if (address && !customer.address) customer.address = address;
      if (dob && !customer.dob) customer.dob = dob;
      await customer.save();
    }

    // Validate and format services
    let calculatedTotal = 0;
    const validatedServices = [];

    for (const s of services) {
      const serviceDoc = await Service.findById(s.service_id);
      if (!serviceDoc) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${s.service_id}`,
        });
      }

      let subServicePrice = 0;
      if (s.sub_service_id && serviceDoc.sub_services?.length) {
        const sub = serviceDoc.sub_services.id(s.sub_service_id);
        if (sub) subServicePrice = sub.price;
      }

      let assignedEmpId = s.employee_id || employee_id || null;
      if (assignedEmpId && assignedEmpId !== "any") {
        const emp = await Employee.findById(assignedEmpId);
        if (!emp) assignedEmpId = null;
      } else {
        assignedEmpId = null;
      }

      const price = Number(s.price) || subServicePrice || (serviceDoc.sub_services?.[0]?.price) || 0;
      const duration = s.duration || serviceDoc.duration || "30 min";

      validatedServices.push({
        service_id: s.service_id,
        sub_service_id: s.sub_service_id || null,
        employee_id: assignedEmpId,
        price,
        duration,
      });

      calculatedTotal += price;
    }

    const finalAmount = amount !== undefined && Number(amount) >= 0 ? Number(amount) : calculatedTotal;
    const isOnline = source === "online";
    const isConfirmed = confirmation_status !== undefined ? confirmation_status : !isOnline;

    const resolvedServiceStatus = service_status || (source === "walk-in" ? "in_progress" : "in_queue");

    // Create the appointment
    const appointment = await Appointment.create({
      customer_id: customer._id,
      services: validatedServices,
      date: date ? new Date(date) : new Date(),
      appointment_time: requestedTime,
      amount: finalAmount,
      service_status: resolvedServiceStatus,
      payment_mode: payment_mode || "",
      source: source || "walk-in",
      note: note || "",
      confirmation_status: isConfirmed,
      payment_status: payment_mode && finalAmount > 0 ? "completed" : "pending",
    });

    // Create payment record if paid
    if (finalAmount > 0 && payment_mode) {
      await Payment.create({
        appointment_id: appointment._id,
        customer_id: customer._id,
        amount: finalAmount,
        payment_mode,
        status: "completed",
        date: new Date(),
      });
    }

    // Populate for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("customer_id", "name phone email gender dob address")
      .populate("services.service_id", "name description duration")
      .populate("services.employee_id", "name phone gender status")
      .lean();

    res.status(201).json({
      success: true,
      message: "Appointment created successfully ✨",
      appointment: populatedAppointment,
    });
  } catch (err) {
    console.error("❌ Create appointment error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 📋 GET ALL APPOINTMENTS
export const getAllAppointments = async (req, res) => {
  try {
    const {
      for_notification,
      date_start,
      date_end,
      limit,
      page = 1,
      customer_id,
      employee_id,
      service_status,
      payment_status,
      source,
    } = req.query;

    const query = {};

    if (for_notification === "true") {
      query.confirmation_status = false;
    } else if (for_notification === "false") {
      query.confirmation_status = { $ne: false };
    }

    if (date_start || date_end) {
      query.date = {};
      if (date_start) {
        query.date.$gte = new Date(`${date_start}T00:00:00.000Z`);
      }
      if (date_end) {
        query.date.$lte = new Date(`${date_end}T23:59:59.999Z`);
      }
    }

    if (customer_id) query.customer_id = customer_id;
    if (service_status) query.service_status = service_status;
    if (payment_status) query.payment_status = payment_status;
    if (source) query.source = source;
    if (employee_id) query["services.employee_id"] = employee_id;

    const parsedLimit = limit ? parseInt(limit, 10) : 0;
    const skip = (parseInt(page, 10) - 1) * (parsedLimit || 0);

    let appointmentsQuery = Appointment.find(query)
      .sort({ date: -1, created_at: -1 })
      .populate("customer_id", "name phone email gender dob address")
      .populate("services.service_id", "name description duration")
      .populate("services.employee_id", "name phone gender status");

    if (parsedLimit > 0) {
      appointmentsQuery = appointmentsQuery.skip(skip).limit(parsedLimit);
    }

    const [appointments, total] = await Promise.all([
      appointmentsQuery.lean(),
      Appointment.countDocuments(query),
    ]);

    const totalAmount = appointments.reduce((sum, a) => sum + (a.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalAmount,
      page: parseInt(page, 10),
      totalPages: parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1,
      appointments,
    });
  } catch (err) {
    console.error("❌ Get appointments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🔍 GET SINGLE APPOINTMENT
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer_id")
      .populate("services.service_id")
      .populate("services.employee_id")
      .lean();

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ UPDATE APPOINTMENT (Supports service_status and payment_status)
export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const {
      name,
      phone,
      email,
      gender,
      address,
      date,
      appointment_time,
      confirmation_status,
      service_status,
      services,
      amount,
      payment_mode,
      payment_status,
      note,
      source,
      rating,
      feedback,
    } = req.body;

    // Update customer info
    if (appointment.customer_id) {
      const customer = await Customer.findById(appointment.customer_id);
      if (customer) {
        if (name) customer.name = name;
        if (phone) customer.phone = phone.replace(/\s+/g, "");
        if (email) customer.email = email;
        if (gender) customer.gender = gender;
        if (address) customer.address = address;
        await customer.save();
      }
    }

    // Update appointment fields
    if (date !== undefined) appointment.date = new Date(date);
    if (appointment_time !== undefined) appointment.appointment_time = appointment_time;
    if (confirmation_status !== undefined) appointment.confirmation_status = confirmation_status;
    if (service_status !== undefined) appointment.service_status = service_status;
    if (note !== undefined) appointment.note = note;
    if (source !== undefined) appointment.source = source;
    if (payment_status !== undefined) appointment.payment_status = payment_status;
    if (rating !== undefined) appointment.rating = rating;
    if (feedback !== undefined) appointment.feedback = feedback;

    // Update services array if provided
    if (services && Array.isArray(services)) {
      const updatedServices = [];
      for (const s of services) {
        let empId = s.employee_id || null;
        if (empId && empId !== "any") {
          const emp = await Employee.findById(empId);
          if (!emp) empId = null;
        } else {
          empId = null;
        }

        updatedServices.push({
          service_id: s.service_id,
          sub_service_id: s.sub_service_id || null,
          employee_id: empId,
          price: Number(s.price) || 0,
          duration: s.duration || "30 min",
        });
      }
      appointment.services = updatedServices;
    }

    if (amount !== undefined) appointment.amount = Number(amount);
    if (payment_mode !== undefined) {
      appointment.payment_mode = payment_mode;
      if (payment_mode) appointment.payment_status = "completed";
    }

    // Record payment if newly marked completed
    if (appointment.amount > 0 && appointment.payment_mode && appointment.payment_status === "completed") {
      const existingPayment = await Payment.findOne({ appointment_id: appointment._id });
      if (!existingPayment) {
        await Payment.create({
          appointment_id: appointment._id,
          customer_id: appointment.customer_id,
          amount: appointment.amount,
          payment_mode: appointment.payment_mode,
          status: "completed",
          date: new Date(),
        });
      }
    }

    const updated = await appointment.save();
    const populated = await Appointment.findById(updated._id)
      .populate("customer_id")
      .populate("services.service_id")
      .populate("services.employee_id");

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully ✅",
      appointment: populated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ DELETE APPOINTMENT
export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    await Payment.deleteMany({ appointment_id: req.params.id });

    res.status(200).json({ success: true, message: "Appointment deleted 🗑️" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
