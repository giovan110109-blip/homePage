const mongoose = require('mongoose')

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  icon: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
  sort: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

menuSchema.index({ parentId: 1, sort: 1 })

module.exports = mongoose.model('Menu', menuSchema)
