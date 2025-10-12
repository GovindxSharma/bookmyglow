import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    salon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item_name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    quantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "pcs",
    },
    threshold: {
      type: Number,
      default: 10,
    },
    cost_per_unit: {
      type: Number,
      default: 0,
    },
    supplier: {
      type: String,
      default: "",
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

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
