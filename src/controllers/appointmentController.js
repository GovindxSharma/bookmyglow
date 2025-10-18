import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

// 📅 CREATE APPOINTMENT (customer-friendly)
export const createAppointment = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      dob,
      address,
      note,
      source, // must be provided
      salon_id,
      employee_id, // optional
      service_id,
      sub_service_id, // optional
      date,
      appointment_time,
      amount,
      payment_mode,
    } = req.body;

    // 1️⃣ Validate minimal required fields
    if (!name || !phone || !source) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and source are required",
      });
    }

    const service = await Service.findById(service_id);
      if (!service) {
        return res
          .status(404)
          .json({ success: false, message: "Service not found" });
        }

    // 2️⃣ Find or create customer
    let customer = await Customer.findOne({ $or: [{ phone }, { email }] });
    if (!customer) {
      customer = await Customer.create({
        name,
        email: email || null,
        phone,
        gender: gender || null,
        dob: dob || null,
        address: address || null,
        note: note || null,
        source,
      });
    }



    // 3️⃣ Prepare appointment data
    const appointmentData = {
      customer_id: customer._id,
      salon_id: salon_id || null,
      employee_id: employee_id || null,
      service_id: service_id || null,
      sub_service_id: sub_service_id || null,
      date: date || null,
      appointment_time: appointment_time || null,
      amount: amount || 0,
      payment_mode: payment_mode || null,
      source,
      note: note || "",
      confirmation_status: false, // receptionist to approve
      payment_status: payment_mode ? "completed" : "pending",
    };

    // 4️⃣ Create appointment
    const appointment = await Appointment.create(appointmentData);

    // 5️⃣ Create payment record if payment info is provided
    if (amount && payment_mode) {
      await Payment.create({
        appointment_id: appointment._id,
        customer_id: customer._id,
        amount,
        payment_mode,
        status: "completed",
        date: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment requested successfully ✨ Awaiting approval.",
      appointment,
    });
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: err.message,
    });
  }
};

// 📋 GET ALL APPOINTMENTS (Admin/Receptionist)
export const getAllAppointments = async (req, res) => {
  try {
    const { for_notification } = req.query;

    // Default: fetch all appointments
    let filter = {};

    // If for_notification is true, filter by unconfirmed and unseen
    if (for_notification === "true") {
      filter = { confirmation_status: false };
    }

    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name phone email gender dob address note")
      .populate("employee_id", "name role")
      .populate("service_id", "name price sub_services")
      .populate("salon_id", "name email role")
      .sort({ created_at: -1 });

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔍 GET SINGLE APPOINTMENT BY ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer_id")
      .populate("employee_id")
      .populate("service_id")
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

    // 💰 If payment details are added during update, create payment
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
