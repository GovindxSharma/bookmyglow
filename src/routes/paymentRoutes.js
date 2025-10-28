import express from "express";
import {
  createPayment,
  updatePayment,
  getAllPayments,
  getPaymentsByDate,
  getPaymentsByEmployeeAndDate,
  getPaymentsGroupedByDate,
} from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/auth.js";


const router = express.Router();

// 🟢 Create a new payment (admin/manual)
router.post("/", verifyToken, createPayment);

// ✏️ Update payment details or status
router.put("/:id", verifyToken, updatePayment);

// 📋 Get all payments (with populated data)
router.get("/", verifyToken, getAllPayments);

// 📅 Get all payments for a specific date
router.get("/date/:date", verifyToken, getPaymentsByDate);

// 👩‍💼 Get payments by employee and date
router.get(
  "/employee/:employee_id/:date",
  verifyToken,
  getPaymentsByEmployeeAndDate
);

// 📊 Get grouped payments by date (for reports/dashboard)
router.get("/grouped", verifyToken, getPaymentsGroupedByDate);

export default router;
