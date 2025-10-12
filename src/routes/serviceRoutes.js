import express from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

import { verifyToken } from "../middlewares/auth.js";
import { checkPermission } from "../middlewares/permission.js"; // ✅ fixed import

const router = express.Router();

// 🟢 Create service (Admin only)
router.post(
  "/",
  verifyToken,
  checkPermission("create", "service"),
  createService
);

// 📋 Get all services (Admin & Receptionist)
router.get(
  "/",
  verifyToken,
  checkPermission("read", "service"),
  getAllServices
);

// 🔍 Get service by ID
router.get(
  "/:id",
  verifyToken,
  checkPermission("read", "service"),
  getServiceById
);

// ✏️ Update service (Admin only)
router.put(
  "/:id",
  verifyToken,
  checkPermission("update", "service"),
  updateService
);

// ❌ Delete service (Admin only)
router.delete(
  "/:id",
  verifyToken,
  checkPermission("delete", "service"),
  deleteService
);

export default router;
