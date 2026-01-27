const mongoose = require("mongoose");

const SampleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "disabled"], default: "active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sample", SampleSchema);
