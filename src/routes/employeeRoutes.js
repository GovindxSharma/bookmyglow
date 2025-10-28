import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createEmployee); // ➕ Create
router.get("/", getAllEmployees); // 📋 All employees (optional salon_id query)
router.get("/:id", getEmployeeById); // 🔍 Single employee
router.put("/:id", updateEmployee); // ✏️ Update
router.delete("/:id", deleteEmployee); // ❌ Delete

export default router;
