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

router.post("/", verifyToken,createEmployee); // ➕ Create
router.get("/", verifyToken, getAllEmployees); // 📋 All employees (optional salon_id query)
router.get("/:id", verifyToken, getEmployeeById); // 🔍 Single employee
router.put("/:id", verifyToken, updateEmployee); // ✏️ Update
router.delete("/:id", verifyToken, deleteEmployee); // ❌ Delete

export default router;
