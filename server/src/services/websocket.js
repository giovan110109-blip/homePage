const WebSocket = require('ws');
const { verifyToken } = require('../utils/adminTokenStore');
const { WsSubscription, WsMessage } = require('../models/websocket');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.pollTimer = null;
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
          WsSubscription.deleteOne({ clientId }).catch(() => {});
        }
        this.clients.delete(clientId);
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
    });

    this.startPolling();
    console.log('[WS] Service initialized');
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
    await WsSubscription.findOneAndUpdate(
      { clientId },
      { clientId, userId },
      { upsert: true }
    );

    client.ws.send(JSON.stringify({ type: 'subscribed' }));
    console.log('[WS] Client subscribed:', clientId, 'userId:', userId);
  }

  startPolling() {
    let lastTime = Date.now();
    
    this.pollTimer = setInterval(async () => {
      try {
        const messages = await WsMessage.find({
          createdAt: { $gt: new Date(lastTime) }
        }).sort({ createdAt: 1 }).limit(100);

        for (const msg of messages) {
          lastTime = msg.createdAt.getTime();
          this.sendToClients(msg.userId, msg.data);
        }
      } catch (e) {
        console.error('[WS] Poll error:', e);
      }
    }, 200);
  }

  sendToClients(userId, data) {
    const msg = JSON.stringify({ type: 'task:update', data });
    
    for (const [, client] of this.clients) {
      if (client.userId === userId && client.ws?.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }

  async broadcast(userId, data) {
    if (!userId) return;
    await WsMessage.create({ userId: userId.toString(), data });
  }

  close() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.wss) this.wss.close();
  }
}

module.exports = new WebSocketService();
