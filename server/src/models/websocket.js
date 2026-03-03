const mongoose = require('mongoose');

const wsSubscriptionSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const wsMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 10 }
});

module.exports = {
  WsSubscription: mongoose.model('WsSubscription', wsSubscriptionSchema),
  WsMessage: mongoose.model('WsMessage', wsMessageSchema)
};
