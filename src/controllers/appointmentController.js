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

// 📋 GET ALL APPOINTMENTS
export const getAllAppointments = async (req, res) => {
  try {
    const { for_notification, date_start, date_end } = req.query;

    const filter = {};

    // ✅ Notification filter
    if (for_notification === "true") {
      filter.confirmation_status = false;
    } else if (for_notification === "false") {
      filter.confirmation_status = true;
    }
console.log("THIS");

    // ✅ Date range filter
    if (date_start && date_end) {
      const start = new Date(date_start);
      const end = new Date(date_end);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    // ✅ Fetch appointments
    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name phone email gender dob address note")
      // .populate("employee_id", "name phone position specialization")
      .populate("services.service_id", "name price")
      .sort({ date: 1 });

    // ✅ Count only matching filtered records
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
      employee_id,
      amount,
      payment_mode,
      name,
      email,
      phone,
      gender,
      dob,
      address,
      note,
    } = req.body;

    // 🔍 Find appointment first
    const appointment = await Appointment.findById(req.params.id).populate(
      "customer_id"
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 👩‍💼 Validate & update employee if provided
    if (employee_id) {
      const employee = await Employee.findById(employee_id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: `Employee not found: ${employee_id}`,
        });
      }
      appointment.employee_id = employee._id;
    }

    // 👤 Update customer info if available
    if (appointment.customer_id) {
      const customer = await Customer.findById(appointment.customer_id);

      if (customer) {
        if (name) customer.name = name;
        if (email) customer.email = email; // ✅ Added email update
        if (phone) customer.phone = phone.replace(/\s+/g, "");
        if (gender) customer.gender = gender;
        if (dob) customer.dob = dob;
        if (address) customer.address = address;
        if (note !== undefined) customer.note = note;
        await customer.save();
      }
    }

    // 🔄 Update appointment fields
    const updatableFields = [
      "date",
      "appointment_time",
      "confirmation_status",
      "note",
      "services",
      "source",
      "payment_status",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        appointment[field] = req.body[field];
      }
    });

    // 💰 Handle payment if provided
    if (amount && payment_mode) {
      const existingPayment = await Payment.findOne({
        appointment_id: appointment._id,
      });

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

      appointment.amount = amount;
      appointment.payment_mode = payment_mode;
      appointment.payment_status = "completed";
    } else if (amount) {
      appointment.amount = amount; // update amount even without payment mode
    }

    // 💾 Save appointment changes
    const updated = await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment & customer updated successfully ✅",
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
