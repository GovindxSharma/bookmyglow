import mongoose from "mongoose";

const subServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const serviceSchema = new mongoose.Schema(
  {
    salon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    sub_services: {
      type: [subServiceSchema], // array of sub-services with name & price
      required: true,
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    discount: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;
