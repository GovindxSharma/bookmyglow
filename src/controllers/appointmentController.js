import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

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

    const normalizedPhone = phone.replace(/\s+/g, "");
    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No existing customer found with this phone number.",
      });
    }

    // 🚫 Disable caching
    res.set("Cache-Control", "no-store");

    res.status(200).json({
      success: true,
      message: "Existing customer found.",
      customer,
    });
  } catch (err) {
    console.error("❌ Error searching customer:", err);
    res.status(500).json({
      success: false,
      message: "Error searching customer.",
      error: err.message,
    });
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
      employee_id, // fallback employee (main)
      services,
      date,
      appointment_time,
      payment_mode,
      confirmation_status,
      amount,
    } = req.body;

    // ✅ Basic validation
    if (!name || !phone || !source || !services || !services.length) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, source, and at least one service are required.",
      });
    }

    const normalizedPhone = phone.replace(/\s+/g, "");

    // 🔍 Find or create customer
    let customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      customer = await Customer.create({
        name,
        phone: normalizedPhone,
        gender: gender || null,
        dob: dob || null,
        address: address || null,
        source,
      });
    } else {
      // update partial info if missing
      if (name && customer.name !== name) customer.name = name;
      if (gender && !customer.gender) customer.gender = gender;
      if (address && !customer.address) customer.address = address;
      await customer.save();
    }

    // 🧾 Validate & calculate total amount
    let totalAmount = 0;
    const validatedServices = [];

    // Check if all services already have employees
    const allHaveEmployee = services.every((s) => s.employee_id);

    for (const s of services) {
      // ✅ Validate service
      const service = await Service.findById(s.service_id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${s.service_id}`,
        });
      }

      // ✅ Employee assignment logic
      let serviceEmployee = null;

      if (s.employee_id) {
        // case: service has its own employee
        serviceEmployee = await Employee.findById(s.employee_id);
        if (!serviceEmployee) {
          return res.status(404).json({
            success: false,
            message: `Employee not found for service: ${s.employee_id}`,
          });
        }
      } else if (employee_id) {
        // case: use fallback employee
        serviceEmployee = await Employee.findById(employee_id);
        if (!serviceEmployee) {
          return res.status(404).json({
            success: false,
            message: `Fallback employee not found: ${employee_id}`,
          });
        }
      } else if (!allHaveEmployee) {
        // case: missing employee and no fallback
        return res.status(400).json({
          success: false,
          message: `Employee not specified for service: ${s.service_id}`,
        });
      }

      const price = s.price || service.price || 0;
      const duration = s.duration || service.duration || "0 min";

      validatedServices.push({
        service_id: s.service_id,
        sub_service_id: s.sub_service_id || null,
        employee_id: serviceEmployee ? serviceEmployee._id : null,
        price,
        duration,
      });

      totalAmount += price;
    }

    // ✅ Handle total amount
    const finalAmount =
      amount && parseFloat(amount) > 0
        ? parseFloat(amount)
        : totalAmount;

    // ✅ Prepare appointment data
    const appointmentData = {
      customer_id: customer._id,
      employee_id: employee_id || null, // main / fallback employee
      services: validatedServices,
      date: date || null,
      appointment_time: appointment_time || null,
      amount: finalAmount,
      payment_mode: payment_mode || null,
      source,
      note: note || "",
      confirmation_status,
      payment_status: payment_mode ? "completed" : "pending",
    };

    // ✅ Create appointment
    const appointment = await Appointment.create(appointmentData);

    // ✅ Record payment if applicable
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

    res.status(201).json({
      success: true,
      message: "Appointment created successfully ✨",
      appointment,
    });
  } catch (err) {
    console.error("❌ Error creating appointment:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: err.message,
    });
  }
};





export const getAllAppointments = async (req, res) => {
  try {
    const { for_notification, range, date_start, date_end } = req.query;

    const filter = {};

    // ✅ Notification filter
    if (for_notification === "true") filter.confirmation_status = false;
    else if (for_notification === "false") filter.confirmation_status = true;

    const now = new Date();
    let start, end;

    // ✅ Handle date-based filtering
    if (range === "today") {
      // Get YYYY-MM-DD for today
      const today = now.toISOString().split("T")[0];
      start = new Date(`${today}T00:00:00.000Z`);
      end = new Date(`${today}T23:59:59.999Z`);
      console.log("📅 Today Range:", { start, end });
    } 
    else if (range === "week") {
      // Start (Monday) and End (Sunday) of this week
      const currentDay = now.getDay(); // 0 = Sunday
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      start = new Date(now);
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      console.log("📅 Weekly Range:", { start, end });
    } 
    else if (range === "month") {
      // Start and End of the month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      console.log("📅 Monthly Range:", { start, end });
    } 
    else if (date_start && date_end) {
      // Custom range
      start = new Date(date_start);
      start.setHours(0, 0, 0, 0);
      end = new Date(date_end);
      end.setHours(23, 59, 59, 999);
      console.log("📅 Custom Range:", { start, end });
    }

    // ✅ Apply filter on created_at date range
    if (start && end) {
      filter.created_at = { $gte: start, $lte: end };
    }

    console.log("🧠 Final Mongo Filter:", JSON.stringify(filter, null, 2));

    // ✅ Fetch appointments and populate
    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name phone email gender dob address note")
      .populate("services.service_id", "name price")
      .populate("services.employee_id", "name")
      .sort({ created_at: -1 });

    const appointment_count = await Appointment.countDocuments(filter);

    res.status(200).json({
      count: appointment_count,
      appointments,
    });
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    res.status(500).json({ message: err.message });
  }
};







// 🔍 GET SINGLE APPOINTMENT
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer_id")
      .populate("employee_id", "name phone position specialization")
      .populate("services.service_id");

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
      name,
      email,
      phone,
      gender,
      dob,
      address,
      note,
      amount,
      payment_mode,
      services, // new: array of services [{ service_id, sub_service_id, employee_id, price, duration }]
      date,
      appointment_time,
      confirmation_status,
      source,
      payment_status,
      rating,
      feedback,
    } = req.body;

    // 🔍 Find appointment first
    const appointment = await Appointment.findById(req.params.id).populate("customer_id");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 👤 Update customer info
    if (appointment.customer_id) {
      const customer = await Customer.findById(appointment.customer_id);
      if (customer) {
        if (name !== undefined) customer.name = name;
        if (email !== undefined) customer.email = email;
        if (phone !== undefined) customer.phone = phone.replace(/\s+/g, "");
        if (gender !== undefined) customer.gender = gender;
        if (dob !== undefined) customer.dob = dob;
        if (address !== undefined) customer.address = address;
        if (note !== undefined) customer.note = note;
        await customer.save();
      }
    }

    // 🔄 Update appointment-level fields
    if (date !== undefined) appointment.date = date;
    if (appointment_time !== undefined) appointment.appointment_time = appointment_time;
    if (confirmation_status !== undefined) appointment.confirmation_status = confirmation_status;
    if (note !== undefined) appointment.note = note;
    if (source !== undefined) appointment.source = source;
    if (payment_status !== undefined) appointment.payment_status = payment_status;
    if (rating !== undefined) appointment.rating = rating;
    if (feedback !== undefined) appointment.feedback = feedback;

    // 💼 Update services array (replace completely if provided)
    if (services && Array.isArray(services)) {
      const updatedServices = [];
      for (const s of services) {
        const serviceObj = {
          service_id: s.service_id,
          sub_service_id: s.sub_service_id || null,
          employee_id: s.employee_id || null,
          price: s.price || 0,
          duration: s.duration || "",
        };

        // Optional: validate employee exists
        if (s.employee_id) {
          const employee = await Employee.findById(s.employee_id);
          if (!employee) {
            return res.status(404).json({
              success: false,
              message: `Employee not found: ${s.employee_id}`,
            });
          }
        }

        updatedServices.push(serviceObj);
      }
      appointment.services = updatedServices;
    }

    // 💰 Handle payment updates
    if (amount !== undefined) appointment.amount = amount;
    if (payment_mode !== undefined) appointment.payment_mode = payment_mode;
    if (amount && payment_mode) appointment.payment_status = "completed";

    // Optional: create payment record if new
    if (amount && payment_mode) {
      const existingPayment = await Payment.findOne({ appointment_id: appointment._id });
      if (!existingPayment) {
        await Payment.create({
          appointment_id: appointment._id,
          customer_id: appointment.customer_id,
          amount,
          payment_mode,
          status: "completed",
          date: new Date(),
        });
      }
    }

    // 💾 Save appointment
    const updated = await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully ✅",
      appointment: updated,
    });
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE APPOINTMENT
export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Appointment not found" });
    res.status(200).json({ message: "Appointment deleted successfully 🗑️" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
