import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

// 📅 CREATE APPOINTMENT (auto customer creation)
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
      source ,
      salon_id,
      employee_id,
      service_id,
      sub_service_id, // may be null
      date,
      appointment_time,
      amount,
      payment_mode,
    } = req.body;

    // 1️⃣ Basic validations
    if (!salon_id || !service_id || !date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: "Missing required appointment fields",
      });
    }

    // 2️⃣ Find or create customer
    let customer = await Customer.findOne({ $or: [{ phone }, { email }] });
    if (!customer) {
      customer = await Customer.create({
        name,
        email,
        phone,
        gender,
        dob,
        address,
        note,
        source,
      });
    }

    // 3️⃣ Fetch service and calculate price
    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    let finalAmount = amount || 0;

    if (sub_service_id && service.sub_services?.length) {
      const sub = service.sub_services.id(sub_service_id);
      if (sub) finalAmount = sub.price;
    } else if (!amount && !service.sub_services?.length) {
      finalAmount = service.price || 0;
    }

    // 4️⃣ Create appointment object dynamically
    const appointmentData = {
      customer_id: customer._id,
      salon_id,
      employee_id,
      service_id,
      date,
      appointment_time,
      duration: service.duration,
      amount: finalAmount,
      payment_mode,
      source,
      note,
      confirmation_status: false,
      payment_status: "pending",
    };

    if (sub_service_id) appointmentData.sub_service_id = sub_service_id;

    const appointment = await Appointment.create(appointmentData);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully ✨ Awaiting approval.",
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
    const appointments = await Appointment.find()
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
