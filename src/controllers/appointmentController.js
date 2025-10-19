import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

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
      salon_id,
      employee_id,
      services, // 👈 now an array
      date,
      appointment_time,
      payment_mode,
      confirmation_status
    } = req.body;

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
        note: note || null,
        source,
      });
    } else {
      // Optional customer info updates
      if (name && customer.name !== name) customer.name = name;
      if (gender && !customer.gender) customer.gender = gender;
      if (address && !customer.address) customer.address = address;
      await customer.save();
    }

    // 🧾 Validate & calculate total amount
    let totalAmount = 0;
    const validatedServices = [];

    for (const s of services) {
      const service = await Service.findById(s.service_id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${s.service_id}`,
        });
      }

      const price = s.price || service.price || 0;
      const duration = s.duration || "0 min";

      validatedServices.push({
        service_id: s.service_id,
        sub_service_id: s.sub_service_id || null,
        price,
        duration,
      });

      totalAmount += price;
    }

    // 💾 Prepare appointment data
    const appointmentData = {
      customer_id: customer._id,
      salon_id,
      employee_id: employee_id || null,
      service_id: service_id || null,
      sub_service_id: sub_service_id || null,
      date: date || null,
      appointment_time: appointment_time || null,
      amount: amount || 0,
      payment_mode: payment_mode || null,
      source,
      note: note || "",
      confirmation_status: confirmation_status || false,
      payment_status: payment_mode ? "completed" : "pending",
      note: note || "",
      source,
      confirmation_status: false,
    };

    const appointment = await Appointment.create(appointmentData);

    // 💰 Optional payment creation
    if (totalAmount > 0 && payment_mode) {
      await Payment.create({
        appointment_id: appointment._id,
        customer_id: customer._id,
        amount: totalAmount,
        payment_mode,
        status: "completed",
        date: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment created successfully ✨ Awaiting approval.",
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
    const { for_notification, date } = req.query;

    const filter = {};
    if (for_notification === "true") filter.confirmation_status = false;
    if (date) filter.date = date;

    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name phone email gender dob address note")
      .populate("employee_id", "name role")
      .populate("services.service_id", "name price")
      .populate("salon_id", "name email role")
      .sort(date ? { created_at: 1 } : { created_at: -1 });

    // 🧮 Add appointment_count of confirmed ones
    const appointment_count = await Appointment.countDocuments({
      confirmation_status: true,
    });

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
      .populate("employee_id")
      .populate("services.service_id")
      .populate("salon_id");

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
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Appointment not found" });

    // 💰 Create payment if added
    const { amount, payment_mode } = req.body;
    if (amount && payment_mode) {
      const existingPayment = await Payment.findOne({
        appointment_id: updated._id,
      });

      if (!existingPayment) {
        await Payment.create({
          appointment_id: updated._id,
          customer_id: updated.customer_id,
          amount,
          payment_mode,
          status: "completed",
          date: new Date(),
        });
      }

      updated.payment_status = "completed";
      await updated.save();
    }

    res.status(200).json({
      message: "Appointment updated successfully ✅",
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
    res.status(200).json({ message: "Appointment deleted successfully 🗑️" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
