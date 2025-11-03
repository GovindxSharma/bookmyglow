import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
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
    res.status(500).json({
      message: "Failed to create payment",
      error: err.message,
    });
  }
};

// ✏️ UPDATE PAYMENT STATUS OR DETAILS
export const updatePayment = async (req, res) => {
  try {
    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Payment not found" });
    }

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
      .populate({
        path: "appointment_id",
        select: "date appointment_time services",
        populate: {
          path: "services.employee_id",
          select: "name phone",
        },
      })
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
    start.setHours(0, 0, 0, 0);
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

// 👩‍🎤 GET PAYMENTS BY EMPLOYEE + DATE (NEW NESTED EMPLOYEE LOGIC)
export const getPaymentsByEmployeeAndDate = async (req, res) => {
  try {
    const { employee_id, date } = req.params;

    if (!employee_id || !date) {
      return res.status(400).json({
        message: "employee_id and date are required",
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const data = await Appointment.aggregate([
      // Filter by day
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          "services.employee_id": new mongoose.Types.ObjectId(employee_id),
        },
      },

      // Deconstruct services array
      { $unwind: "$services" },

      // Keep only this employee's services
      {
        $match: {
          "services.employee_id": new mongoose.Types.ObjectId(employee_id),
        },
      },

      // Sum their service price
      {
        $group: {
          _id: null,
          total_employee_amount: { $sum: "$services.price" },

          // count unique appointments
          appointments_set: { $addToSet: "$_id" },

          appointments: {
            $push: {
              appointment_id: "$_id",
              date: "$date",
              price: "$services.price",
              service_id: "$services.service_id",
            },
          },
        },
      },
    ]);

    if (!data.length) {
      return res.status(404).json({
        message: "No appointments found for this employee on this date",
      });
    }

    // Final response formatting
    const result = data[0];

    res.status(200).json({
      message: "Employee earnings for selected date",
      employee_id,
      date,
      total_appointments: result.appointments_set.length,
      total_employee_amount: result.total_employee_amount,
      appointments: result.appointments,
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// 📊 GROUP PAYMENTS BY DATE (monthly report)
export const getPaymentsGroupedByDate = async (req, res) => {
  try {
    const grouped = await Payment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total_amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeePerformanceByRange = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { start, end } = req.query;

    if (!employeeId || !start || !end) {
      return res.status(400).json({
        success: false,
        message: "employeeId, start date & end date are required",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const empObjectId = new mongoose.Types.ObjectId(employeeId);

    const data = await Appointment.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          "services.employee_id": empObjectId,
        },
      },
      { $unwind: "$services" },
      {
        $match: {
          "services.employee_id": empObjectId,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: "services",
          localField: "services.service_id",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $project: {
          appointmentId: "$_id",
          date: "$created_at",
          customerName: "$customer.name",
          serviceName: "$service.name",
          amount: "$services.price",
        },
      },
    ]);

    const totalAppointments = data.length;
    const totalRevenue = data.reduce((sum, a) => sum + (a.amount || 0), 0);

    return res.json({
      success: true,
      employeeId,
      range: { start, end },
      summary: {
        totalAppointments,
        totalRevenue,
      },
      appointments: data,
    });
  } catch (err) {
    console.error("getEmployeePerformanceByRange error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
