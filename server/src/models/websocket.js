const mongoose = require('mongoose');

const wsSubscriptionSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 300
  }
});

wsSubscriptionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const wsMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 3600
  }
});

wsMessageSchema.index({ userId: 1, createdAt: 1 });
wsMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = {
  WsSubscription: mongoose.model('WsSubscription', wsSubscriptionSchema),
  WsMessage: mongoose.model('WsMessage', wsMessageSchema)
};
