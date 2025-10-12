import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
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
    note: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["online", "walk-in"],
      default: "walk-in",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
