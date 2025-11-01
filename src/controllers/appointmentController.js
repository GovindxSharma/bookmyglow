import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

// 📞 SEARCH CUSTOMER BY PHONE
export const searchCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone)
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });

    const normalizedPhone = phone.replace(/\s+/g, "");
    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer)
      return res.status(404).json({
        success: false,
        message: "No existing customer found",
      });

    res.set("Cache-Control", "no-store");
    res.status(200).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 📅 CREATE APPOINTMENT
export const createAppointment = async (req, res) => {
  try {
    const {
      name,
      phone,
      gender,
      dob,
      address,
      note,
      source,
      services,
      date,
      appointment_time,
      payment_mode,
      confirmation_status,
      amount,
    } = req.body;

    // Validate required fields
    if (!name || !phone || !source || !services?.length) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, source & services required",
      });
    }

    const normalizedPhone = phone.replace(/\s+/g, "");
    let customer = await Customer.findOne({ phone: normalizedPhone });

    // Create customer if not exists
    if (!customer) {
      customer = await Customer.create({
        name,
        phone: normalizedPhone,
        gender,
        dob,
        address,
        source,
      });
    } else {
      // Update customer info if provided
      if (name && customer.name !== name) customer.name = name;
      if (gender && !customer.gender) customer.gender = gender;
      if (address && !customer.address) customer.address = address;
      if (dob && !customer.dob) customer.dob = dob;
      await customer.save();
    }

    // ✅ Validate and format services with employee per service
    let totalAmount = 0;
    const validatedServices = [];

    // Check if all services already have employees
    const allHaveEmployee = services.every((s) => s.employee_id);

    for (const s of services) {
      // ✅ Validate service
      const service = await Service.findById(s.service_id);
      if (!service)
        return res.status(404).json({
          success: false,
          message: `Service not found: ${s.service_id}`,
        });

      let employee_id = null;
      if (s.employee_id) {
        const emp = await Employee.findById(s.employee_id);
        if (!emp)
          return res.status(404).json({
            success: false,
            message: `Invalid employee for service: ${s.service_id}`,
          });
        employee_id = emp._id;
      }

      const price = s.price ?? service.price ?? 0;
      const duration = s.duration ?? "0 min";

      validatedServices.push({
        service_id: s.service_id,
        sub_service_id: s.sub_service_id ?? null,
        employee_id,
        price,
        duration,
      });

      totalAmount += price;
    }

    const finalAmount = amount > 0 ? amount : totalAmount;

    // Create the appointment
    const appointment = await Appointment.create({
      customer_id: customer._id,
      services: validatedServices,
      date,
      appointment_time,
      amount: finalAmount,
      payment_mode: payment_mode ?? null,
      source,
      note: note ?? "",
      confirmation_status: confirmation_status ?? true,
      payment_status: payment_mode ? "completed" : "pending",
    });

    // Create payment record if needed
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

    // ✅ Populate for response (including nested services.employee_id)
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: "customer_id",
        select: "name phone email gender dob address note",
      })
      .populate({
        path: "services.service_id",
        select: "name price",
      })
      .populate({
        path: "services.employee_id",
        select: "name phone position specialization",
      })
      .lean();

    // Fix services to keep employee_id and duration intact
    populatedAppointment.services = populatedAppointment.services.map(
      (s, i) => ({
        ...s,
        employee_id: s.employee_id
          ? s.employee_id
          : validatedServices[i].employee_id,
        duration: s.duration ? s.duration : validatedServices[i].duration,
      })
    );

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
    const { for_notification, date_start, date_end } = req.query;
    const filter = {};

    if (for_notification === "true") filter.confirmation_status = false;
    if (for_notification === "false") filter.confirmation_status = true;

    if (date_start && date_end) {
      const start = new Date(date_start);
      const end = new Date(date_end);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name phone email gender dob address note")
      .populate("services.service_id", "name price")
      .populate("services.employee_id", "name phone position specialization")
      .sort({ date: 1 });

    const appointment_count = await Appointment.countDocuments(filter);

    res.status(200).json({
      count: appointment_count,
      appointments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 GET SINGLE APPOINTMENT
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer_id")
      .populate("services.service_id", "name price")
      .populate("services.employee_id", "name phone position specialization");

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ UPDATE APPOINTMENT
export const updateAppointment = async (req, res) => {
  try {
    const {
      amount,
      payment_mode,
      name,
      phone,
      gender,
      dob,
      address,
      note,
      services,
    } = req.body;

    const appointment = await Appointment.findById(req.params.id).populate(
      "customer_id"
    );
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // ✅ Update customer
    const customer = appointment.customer_id;
    if (customer) {
      if (name) customer.name = name;
      if (phone) customer.phone = phone.replace(/\s+/g, "");
      if (gender) customer.gender = gender;
      if (dob) customer.dob = dob;
      if (address) customer.address = address;
      if (note !== undefined) customer.note = note;
      await customer.save();
    }

    // ✅ Update services with employee per service
    if (services?.length) {
      const updatedServices = [];

      for (const s of services) {
        const serviceExists = await Service.findById(s.service_id);
        if (!serviceExists)
          return res.status(404).json({
            success: false,
            message: `Service not found: ${s.service_id}`,
          });

        if (s.employee_id) {
          const emp = await Employee.findById(s.employee_id);
          if (!emp)
            return res.status(404).json({
              success: false,
              message: `Invalid employee for service ${s.service_id}`,
            });
        }

        updatedServices.push({
          service_id: s.service_id,
          sub_service_id: s.sub_service_id ?? null,
          employee_id: s.employee_id ?? null,
          price: s.price ?? 0,
          duration: s.duration ?? "0 min",
        });
      }

      appointment.services = updatedServices;
    }

    // ✅ Update appointment fields
    const fieldsToUpdate = [
      "date",
      "appointment_time",
      "confirmation_status",
      "note",
      "source",
      "payment_status",
    ];
    fieldsToUpdate.forEach(
      (f) => req.body[f] !== undefined && (appointment[f] = req.body[f])
    );

    // ✅ Handle payment
    if (amount && payment_mode) {
      const existingPayment = await Payment.findOne({
        appointment_id: appointment._id,
      });
      if (!existingPayment) {
        await Payment.create({
          appointment_id: appointment._id,
          customer_id: customer._id,
          amount,
          payment_mode,
          status: "completed",
          date: new Date(),
        });
      }
      appointment.amount = amount;
      appointment.payment_mode = payment_mode;
      appointment.payment_status = "completed";
    }

    const updated = await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment updated ✅",
      appointment: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE APPOINTMENT
export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({ message: "Appointment deleted 🗑️" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
