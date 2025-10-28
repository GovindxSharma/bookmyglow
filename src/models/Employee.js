import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    dob: {
      type: Date,
    },
    address: {
      type: String,
      default: "",
    },
    status: {
      type: Boolean,
      default: true, // Active by default
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
