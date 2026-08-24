import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { verifyToken } from "../middlewares/auth.js";


const router = express.Router();

router.get("/", getAllEmployees); // 📋 All employees (Public read for client booking)
router.get("/:id", getEmployeeById); // 🔍 Single employee
router.post("/", verifyToken, createEmployee); // ➕ Create (Admin only)
router.put("/:id", verifyToken, updateEmployee); // ✏️ Update (Admin only)
router.delete("/:id", verifyToken, deleteEmployee); // ❌ Delete (Admin only)

export default router;

