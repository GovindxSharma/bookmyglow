import express from "express";
import {
  createPayment,
  updatePayment,
  getAllPayments,
  getPaymentsByDate,
  getPaymentsByEmployeeAndDate,
  getPaymentsGroupedByDate,
} from "../controllers/paymentController.js";

const router = express.Router();

// 🟢 Create a new payment (admin/manual)
router.post("/", createPayment);

// ✏️ Update payment details or status
router.put("/:id", updatePayment);

// 📋 Get all payments (with populated data)
router.get("/", getAllPayments);

// 📅 Get all payments for a specific date
router.get("/date/:date", getPaymentsByDate);

// 👩‍💼 Get payments by employee and date
router.get("/employee/:employee_id/:date", getPaymentsByEmployeeAndDate);

// 📊 Get grouped payments by date (for reports/dashboard)
router.get("/grouped", getPaymentsGroupedByDate);

export default router;
