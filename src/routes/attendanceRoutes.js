import express from "express";
import {
  createAttendance,
  getAllAttendance,
  getAttendanceByEmployee,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js";

import { verifyToken } from "../middlewares/auth.js";
import { checkPermission } from "../middlewares/permission.js";

const router = express.Router();

// 🟢 Create attendance (admin/receptionist)
router.post(
  "/",
  verifyToken,
  checkPermission("create", "attendance"),
  createAttendance
);

// 📋 Get all attendance (admin/receptionist)
router.get(
  "/",
  verifyToken,
  checkPermission("read", "attendance"),
  getAllAttendance
);

// 🔍 Get attendance by employee ID
router.get(
  "/employee/:employee_id",
  verifyToken,
  checkPermission("read", "attendance"),
  getAttendanceByEmployee
);

// ✏️ Update attendance (mark leave)
router.put(
  "/:id",
  verifyToken,
  checkPermission("update", "attendance"),
  updateAttendance
);

// ❌ Delete attendance (admin only)
router.delete(
  "/:id",
  verifyToken,
  checkPermission("delete", "attendance"),
  deleteAttendance
);

export default router;
