type Handler = (data: any) => void

class WsService {
  private ws: WebSocket | null = null
  private url: string
  private handlers = new Map<string, Set<Handler>>()
  private taskSubscriptionToken: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private manualClose = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    if (import.meta.env.DEV) {
      const api = import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8999'
      const host = api.replace(/^https?:\/\//, '')
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      this.url = `${protocol}//${host}/ws`
      console.log('[WS] 开发环境 WebSocket URL:', this.url)
    } else {
      const api = import.meta.env.VITE_API_BASE_URL || ''
      if (api) {
        const host = api.replace(/^https?:\/\//, '')
        this.url = `wss://${host}/ws`
      } else {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
        this.url = `${protocol}//${location.host}/ws`
      }
      console.log('[WS] 生产环境 WebSocket URL:', this.url)
    }
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WS] 已经连接，跳过')
      return Promise.resolve()
    }
    
    this.manualClose = false
    console.log('[WS] 正在连接:', this.url)
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('[WS] 连接成功')
        this.reconnectAttempts = 0
        if (this.taskSubscriptionToken) {
          this.send('subscribe:tasks', { token: this.taskSubscriptionToken })
        }
        resolve()
      }
      
      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        console.log('[WS] 收到消息:', msg.type, msg)
        this.handlers.get(msg.type)?.forEach(h => h(msg.data ?? msg))
      }
      
      this.ws.onclose = () => {
        console.log('[WS] 连接关闭')
        this.ws = null
        if (!this.manualClose) {
          this.reconnect()
        }
      }
      
      this.ws.onerror = (e) => {
        console.error('[WS] 连接错误:', e)
        reject(e)
      }
    })
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    if (this.manualClose) return

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`[WS] 重连中... 第 ${this.reconnectAttempts} 次，延迟 ${delay}ms`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect().catch(() => {})
    }, delay)
  }

  send(type: string, data?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WS] 发送消息:', type, data)
      this.ws.send(JSON.stringify({ type, data }))
    } else {
      console.warn('[WS] 未连接，无法发送消息:', type)
    }
  }

  on(type: string, h: Handler) {
    const set = this.handlers.get(type) || new Set()
    set.add(h)
    this.handlers.set(type, set)
    return () => set.delete(h)
  }

  subscribe(token: string, cb: Handler) {
    this.taskSubscriptionToken = token
    console.log('[WS] 订阅任务更新')
    if (this.isConnected) {
      this.send('subscribe:tasks', { token })
    }
    return this.on('task:update', cb)
  }

  close() {
    this.manualClose = true
    this.taskSubscriptionToken = null
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsService = new WsService()
