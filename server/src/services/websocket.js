const WebSocket = require('ws');
const { verifyToken } = require('../utils/adminTokenStore');
const { WsSubscription, WsMessage } = require('../models/websocket');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.userClients = new Map();
  }

  init(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws) => {
      const clientId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.clients.set(clientId, { ws, userId: null });

      ws.on('message', (data) => {
        this.handleMessage(clientId, data).catch(e => console.error('[WS]', e));
      });

      ws.on('close', () => {
        const client = this.clients.get(clientId);
        if (client?.userId) {
          this.removeFromUserMap(client.userId, clientId);
          WsSubscription.deleteOne({ clientId }).catch(() => {});
        }
        this.clients.delete(clientId);
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
    });

    console.log('[WS] Service initialized (direct push mode)');
  }

  async handleMessage(clientId, data) {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type !== 'subscribe:tasks') return;

    const user = await verifyToken(msg.data?.token);
    if (!user) return;

    const userId = user._id.toString();
    const client = this.clients.get(clientId);
    if (!client) return;

    client.userId = userId;
    
    this.addToUserMap(userId, clientId);
    
    await WsSubscription.findOneAndUpdate(
      { clientId },
      { clientId, userId },
      { upsert: true }
    );

    client.ws.send(JSON.stringify({ type: 'subscribed' }));
    console.log('[WS] Client subscribed:', clientId, 'userId:', userId);
  }

  addToUserMap(userId, clientId) {
    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set());
    }
    this.userClients.get(userId).add(clientId);
  }

  removeFromUserMap(userId, clientId) {
    const clientSet = this.userClients.get(userId);
    if (clientSet) {
      clientSet.delete(clientId);
      if (clientSet.size === 0) {
        this.userClients.delete(userId);
      }
    }
  }

  sendToUser(userId, data) {
    const clientIds = this.userClients.get(userId?.toString());
    if (!clientIds || clientIds.size === 0) return false;

    const msg = JSON.stringify({ type: 'task:update', data });
    let sent = 0;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client?.ws?.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
        sent++;
      }
    }

    return sent > 0;
  }

  async broadcast(userId, data) {
    if (!userId) return;
    
    const sent = this.sendToUser(userId, data);
    
    if (!sent) {
      await WsMessage.create({ 
        userId: userId.toString(), 
        data,
        createdAt: new Date()
      });
    }
  }

  async sendPendingMessages(userId) {
    const messages = await WsMessage.find({ 
      userId: userId.toString() 
    }).sort({ createdAt: 1 }).limit(50);

    for (const msg of messages) {
      this.sendToUser(userId, msg.data);
    }

    if (messages.length > 0) {
      await WsMessage.deleteMany({ 
        _id: { $in: messages.map(m => m._id) } 
      });
    }
  }

  close() {
    if (this.wss) {
      this.wss.close();
    }
    this.clients.clear();
    this.userClients.clear();
  }
}

module.exports = new WebSocketService();
