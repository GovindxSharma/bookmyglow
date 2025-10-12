import Service from "../models/Service.js";

// 🟢 CREATE SERVICE (Admin only)
export const createService = async (req, res) => {
  try {
    const { salon_id, name, description, duration, sub_services } = req.body;

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    if (!salon_id) {
      return res.status(400).json({ message: "salon_id is required" });
    }

    if (
      !sub_services ||
      !Array.isArray(sub_services) ||
      sub_services.length === 0
    ) {
      return res
        .status(400)
        .json({
          message: "sub_services array is required with at least one item",
        });
    }

    const service = await Service.create({
      salon_id,
      name,
      description: description || "",
      duration: duration || "",
      sub_services,
      status: true,
    });

    res.status(201).json({
      message: "Service created successfully ✨",
      service,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to create service", error: err.message });
  }
};

// 📋 GET ALL SERVICES
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({}).sort({ created_at: -1 });
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 GET SERVICE BY ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    res.status(200).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ UPDATE SERVICE (Admin only)
export const updateService = async (req, res) => {
  try {
    const { salon_id, ...updateData } = req.body;

    const updated = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({
      message: "Service updated successfully ✅",
      service: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE SERVICE (Admin only)
export const deleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service deleted successfully 🗑️" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
