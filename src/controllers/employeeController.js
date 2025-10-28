import Employee from "../models/Employee.js";

// ➕ CREATE EMPLOYEE
export const createEmployee = async (req, res) => {
  try {
    const { name, phone, } = req.body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, and phone are required.",
        });
    }

    const existing = await Employee.findOne({ phone });
    if (existing)
      return res
        .status(400)
        .json({
          success: false,
          message: "Employee with this phone already exists.",
        });

    const employee = await Employee.create(req.body);
    res.status(201).json({
      success: true,
      message: "Employee created successfully 👩‍💼",
      employee,
    });
  } catch (err) {
    console.error("❌ Error creating employee:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📋 GET ALL EMPLOYEES (optional filter by salon)
export const getAllEmployees = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status === "true";

    const employees = await Employee.find(filter).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔍 GET SINGLE EMPLOYEE BY ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      "name email gender"
    );
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.status(200).json({ success: true, employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res
      .status(200)
      .json({
        success: true,
        message: "Employee updated successfully ✅",
        employee: updated,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully 🗑️" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
