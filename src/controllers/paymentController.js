import Payment from "../models/Payment.js";
import mongoose from "mongoose";

// 🟢 CREATE PAYMENT (manual / admin)
export const createPayment = async (req, res) => {
  try {
    const { appointment_id, customer_id, amount, payment_mode, status, date } =
      req.body;

    if (!appointment_id || !customer_id || !amount || !payment_mode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payment = await Payment.create({
      appointment_id,
      customer_id,
      amount,
      payment_mode,
      status: status || "completed",
      date: date || new Date(),
    });

    res.status(201).json({
      message: "Payment recorded successfully ✨",
      payment,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create payment", error: err.message });
  }
};

// ✏️ UPDATE PAYMENT STATUS OR DETAILS
export const updatePayment = async (req, res) => {
  try {
    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Payment not found" });

    res.status(200).json({
      message: "Payment updated successfully ✅",
      payment: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📋 GET ALL PAYMENTS
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate(
        "appointment_id",
        "date appointment_time employee_id service_id"
      )
      .populate("customer_id", "name phone email")
      .sort({ created_at: -1 });

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📅 GET PAYMENTS BY DATE
export const getPaymentsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const payments = await Payment.find({
      date: { $gte: start, $lte: end },
    }).populate("customer_id", "name phone");

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👩‍🎤 GET PAYMENTS BY EMPLOYEE (from Appointment ref)
export const getPaymentsByEmployeeAndDate = async (req, res) => {
  try {
    const { employee_id, date } = req.params;

    if (!employee_id || !date) {
      return res.status(400).json({
        message: "employee_id and date are required in params",
      });
    }

    // Convert string date to actual Date range (00:00 - 23:59)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await Payment.aggregate([
      // 1️⃣ Join Appointment to access employee info
      {
        $lookup: {
          from: "appointments",
          localField: "appointment_id",
          foreignField: "_id",
          as: "appointment",
        },
      },
      { $unwind: "$appointment" },

      // 2️⃣ Filter by employee and date range
      {
        $match: {
          "appointment.employee_id": new mongoose.Types.ObjectId(employee_id),
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },

      // 3️⃣ Group summary
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$amount" },
          total_payments: { $sum: 1 },
          payments: {
            $push: {
              payment_id: "$_id",
              amount: "$amount",
              payment_mode: "$payment_mode",
              status: "$status",
              appointment_id: "$appointment_id",
              date: "$date",
            },
          },
        },
      },
    ]);

    if (!payments.length)
      return res
        .status(404)
        .json({ message: "No payments found for this employee on this date" });

    res.status(200).json({
      message: "Payments for employee on specified date",
      employee_id,
      date,
      summary: payments[0],
    });
  } catch (err) {
    console.error("Error fetching payments by employee and date:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📊 GROUP PAYMENTS BY DATE (for reports/dashboard)
export const getPaymentsGroupedByDate = async (req, res) => {
  try {
    const grouped = await Payment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, // group by month
          total_amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // sort chronologically
    ]);

    res.status(200).json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

