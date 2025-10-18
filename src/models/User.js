import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "receptionist", "employee"], //removed Cutomer user
      // default: "",
    },
    phone: {
      type: [String],
      default: [],
    },
    profile_picture: {
      type: String,
      default: "",
    },
    status: {
      type: Boolean,
      default: true,
    },
    status_updated: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
      default: "",
    },
    permissions: {
      type: [String],
      enum: ["create", "read", "update", "delete"],
      default: [],
    },
    access_token: {
      type: String,
      default: "",
    },
    refresh_token: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const User = mongoose.model("User", userSchema);
export default User;
