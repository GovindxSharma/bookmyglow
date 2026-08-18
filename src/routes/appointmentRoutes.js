import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  searchCustomerByPhone,
  getSlotAvailability,
} from "../controllers/appointmentController.js";
import { verifyToken } from "../middlewares/auth.js";
import { checkPermission } from "../middlewares/permission.js";

const router = express.Router();

// ⏱️ Real-time slot availability for selected date & stylist (Public)
router.get("/availability", getSlotAvailability);

// 🧾 Create appointment (Public online bookings & Front desk POS)
router.post("/", createAppointment);

// 📋 View all appointments (Protected)
router.get("/", verifyToken, getAllAppointments);

// 📞 Customer search by phone
router.get("/customer/search/", verifyToken, searchCustomerByPhone);

// 🔍 Single appointment
router.get("/:id", verifyToken, checkPermission("read", "appointment"), getAppointmentById);

// ✏️ Update appointment
router.put("/:id", verifyToken, updateAppointment);

// 🗑 Delete appointment
router.delete("/:id", verifyToken, deleteAppointment);

export default router;
