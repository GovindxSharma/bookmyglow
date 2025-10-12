import Attendance from "../models/Attendance.js";

// 🟢 CREATE ATTENDANCE RECORD
export const createAttendance = async (req, res) => {
  try {
    const { employee_id, date, leave } = req.body;

    if (!employee_id || !date) {
      return res
        .status(400)
        .json({ message: "employee_id and date are required" });
    }

    const existing = await Attendance.findOne({ employee_id, date });
    if (existing) {
      return res
        .status(400)
        .json({
          message: "Attendance already marked for this employee on this date",
        });
    }

    const attendance = await Attendance.create({
      employee_id,
      date,
      leave: leave || false,
    });

    res.status(201).json({
      message: "Attendance recorded successfully ✨",
      attendance,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to record attendance", error: err.message });
  }
};

// 📋 GET ALL ATTENDANCE RECORDS
export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("employee_id", "name role")
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 GET ATTENDANCE BY EMPLOYEE
export const getAttendanceByEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const records = await Attendance.find({ employee_id })
      .populate("employee_id", "name role")
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ UPDATE ATTENDANCE (mark leave or unmark)
export const updateAttendance = async (req, res) => {
  try {
    const { leave } = req.body;

    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { leave },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Attendance record not found" });

    res.status(200).json({
      message: "Attendance updated successfully ✅",
      attendance: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE ATTENDANCE
export const deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Attendance record not found" });

    res.status(200).json({ message: "Attendance deleted successfully 🗑️" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
