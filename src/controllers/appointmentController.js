import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

// 📅 CREATE APPOINTMENT (customer-friendly)
export const createAppointment = async (req, res) => {
  try {
    const {
      name,
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
      confirmation_status
    } = req.body;

    // 1️⃣ Validate minimal required fields
    if (!name || !phone || !source) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and source are required",
      });
    }

    // Normalize phone number — remove spaces or dashes
    const normalizedPhone = phone.replace(/\s+/g, "");

    console.log("📞 Phone number received from payload:", normalizedPhone);

    // 2️⃣ Validate service existence
    const service = await Service.findById(service_id);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    // 3️⃣ Find or create customer by phone only
    let customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      console.log(
        "🆕 No existing customer found with this phone. Creating new..."
      );

      customer = await Customer.create({
        name,
        phone: normalizedPhone,
        gender: gender || null,
        dob: dob || null,
        address: address || null,
        note: note || null,
        source,
      });

      console.log("✅ New customer created:", {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
      });
    } else {
      console.log("👀 Existing customer found:", {
        id: customer._id,
        existingName: customer.name,
        existingPhone: customer.phone,
      });

      let updated = false;

      if (name && customer.name !== name) {
        console.log(
          `✏️ Updating customer name from "${customer.name}" → "${name}"`
        );
        customer.name = name;
        updated = true;
      }

      if (gender && !customer.gender) {
        customer.gender = gender;
        updated = true;
      }

      if (address && !customer.address) {
        customer.address = address;
        updated = true;
      }

      if (updated) {
        await customer.save();
        console.log("💾 Customer updated successfully:", {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
        });
      } else {
        console.log("⚖️ No customer updates needed.");
      }
    }

    // 4️⃣ Prepare appointment data
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
      confirmation_status: confirmation_status || false,
      payment_status: payment_mode ? "completed" : "pending",
    };

    // 5️⃣ Create appointment
    const appointment = await Appointment.create(appointmentData);
    console.log("🗓️ New appointment created:", {
      id: appointment._id,
      customer: customer.name,
      date: appointment.date,
      source: appointment.source,
    });

    // 6️⃣ Optional payment record
    if (amount && payment_mode) {
      await Payment.create({
        appointment_id: appointment._id,
        customer_id: customer._id,
        amount,
        payment_mode,
        status: "completed",
        date: new Date(),
      });
      console.log(
        "💰 Payment record created for appointment:",
        appointment._id
      );
    }

    // 7️⃣ Final response
    res.status(201).json({
      success: true,
      message: "Appointment requested successfully ✨ Awaiting approval.",
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
