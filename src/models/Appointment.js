import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    salon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
     // 👇 NEW FIELD
     sub_service_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    appointment_time: {
      type: String,
      required: true,
    },
    confirmation_status: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: String,
      default: "",
    },
    rating: {
      type: String,
      default: "",
    },
    feedback: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    payment_mode: {
      type: String,
      enum: ["cash", "card", "upi", "wallet", ""],
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

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
