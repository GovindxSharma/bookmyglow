import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

// REGISTER
export const register = async (req, res) => {
  const { name, email, password, role, address, phone, gender } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  if (role !== "employee" && !password) {
    return res
      .status(400)
      .json({ message: "Password is required for user account creation" });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role || "receptionist",
      address: address || "",
      gender: gender || "other",
      phone: Array.isArray(phone) ? phone : phone ? [phone] : [],
    };

    if (password && role !== "employee") {
      const hashedPassword = await bcrypt.hash(password, 10);
      userData.password = hashedPassword;
    }

    const user = await User.create(userData);
    const token = generateToken(user);
    user.access_token = token;
    await user.save();

    res.status(201).json({
      message: "User registered successfully ✨",
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = generateToken(user);

    // Store token in DB
    user.access_token = token;
    await user.save();

    res.status(200).json({
      message: "Login successful ✨",
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : authHeader;

    const user = await User.findOne({ access_token: token });
    if (user) {
      user.access_token = null;
      await user.save();
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  try {
    if (updates.password && updates.password.trim() !== "") {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password -access_token");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully ✅", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -access_token").sort({ created_at: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL EMPLOYEES
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select(
      "-password -access_token"
    );

    res.status(200).json({
      message: "Employees fetched successfully",
      employees,
    });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully 🗑️" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
