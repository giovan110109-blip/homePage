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
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws) => {
      const clientId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.clients.set(clientId, { ws, userId: null });
      console.log('[WS] Client connected:', clientId);

      ws.on('message', (data) => {
        this.handleMessage(clientId, data).catch(e => console.error('[WS]', e));
      });

      ws.on('close', () => {
        console.log('[WS] Client disconnected:', clientId);
        const client = this.clients.get(clientId);
        if (client?.userId) {
          this.removeFromUserMap(client.userId, clientId);
          WsSubscription.deleteOne({ clientId }).catch(() => {});
        }
        this.clients.delete(clientId);
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
    });

    console.log('[WS] Service initialized on path /ws');
  }

  async handleMessage(clientId, data) {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.log('[WS] 消息解析失败:', e.message);
      return;
    }

    console.log('[WS] 收到消息:', msg.type, msg);

    if (msg.type !== 'subscribe:tasks') {
      console.log('[WS] 忽略非订阅消息:', msg.type);
      return;
    }

    const user = await verifyToken(msg.data?.token);
    if (!user) {
      console.log('[WS] Token 验证失败');
      return;
    }

    const userId = user._id.toString();
    const client = this.clients.get(clientId);
    if (!client) {
      console.log('[WS] 客户端不存在:', clientId);
      return;
    }

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
    console.log(`[WS] addToUserMap: userId=${userId}, clientId=${clientId}, userClients size=${this.userClients.get(userId).size}`);
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
    const userIdStr = userId?.toString();
    const clientIds = this.userClients.get(userIdStr);
    console.log(`[WS] sendToUser: userId=${userIdStr}, clients=${clientIds?.size || 0}`);
    
    if (!clientIds || clientIds.size === 0) {
      console.log(`[WS] 没有找到用户 ${userIdStr} 的连接`);
      console.log(`[WS] userClients keys:`, [...this.userClients.keys()]);
      return false;
    }

    const msg = JSON.stringify({ type: 'task:update', data });
    let sent = 0;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      console.log(`[WS] 检查客户端 ${clientId}, readyState=${client?.ws?.readyState}`);
      if (client?.ws?.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
        sent++;
        console.log(`[WS] 已发送消息到客户端 ${clientId}`);
      }
    }

    console.log(`[WS] sendToUser 完成: 发送了 ${sent} 条消息`);
    return sent > 0;
  }

  async broadcast(userId, data) {
    if (!userId) {
      console.log('[WS] broadcast: userId 为空，跳过');
      return;
    }
    
    console.log(`[WS] broadcast: userId=${userId.toString()}, data=`, JSON.stringify(data));
    const sent = this.sendToUser(userId, data);
    
    if (!sent) {
      console.log(`[WS] 用户 ${userId} 不在线，存储离线消息`);
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
