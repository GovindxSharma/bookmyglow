import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  searchCustomerByPhone
} from "../controllers/appointmentController.js";
import { verifyToken } from "../middlewares/auth.js";
import { checkPermission } from "../middlewares/permission.js"; // ✅ updated import

const router = express.Router();

// 🧾 receptionist/admin can create appointment
router.post(
  "/",
  // verifyToken,
  // checkPermission("create", "appointment"),
  createAppointment
);

// 📋 admin/receptionist view appointments
router.get(
  "/",
  // verifyToken,
  // checkPermission("read", "appointment"),
  getAllAppointments
);

router.get(
  "/:id",
  verifyToken,
  checkPermission("read", "appointment"),
  getAppointmentById
);

// ✏️ update appointment (admin/receptionist)
router.put(
  "/:id",
  // verifyToken,
  // checkPermission("update", "appointment"),
  updateAppointment
);

// 🗑 delete appointment (admin/super_admin only)
router.delete(
  "/:id",
  verifyToken,
  checkPermission("delete", "appointment"),
  deleteAppointment
);

router.get("/customer/search/", searchCustomerByPhone);


export default router;
