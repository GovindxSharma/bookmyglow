import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_mode: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
