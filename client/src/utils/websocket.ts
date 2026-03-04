type Handler = (data: any) => void

class WsService {
  private ws: WebSocket | null = null
  private url: string
  private handlers = new Map<string, Set<Handler>>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private manualClose = false

  constructor() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    if (import.meta.env.DEV) {
      const api = import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8999'
      this.url = `${protocol}//${api.replace(/^https?:\/\//, '')}`
    } else {
      const api = import.meta.env.VITE_API_BASE_URL || ''
      this.url = api ? `${protocol}//${api.replace(/^https?:\/\//, '')}` : `${protocol}//${location.host}`
    }
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve()
    
    this.manualClose = false
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }
      
      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        this.handlers.get(msg.type)?.forEach(h => h(msg.data ?? msg))
      }
      
      this.ws.onclose = () => {
        this.ws = null
        if (!this.manualClose) {
          this.reconnect()
        }
      }
      
      this.ws.onerror = (e) => reject(e)
    })
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    if (this.manualClose) return

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      this.connect().catch(() => {})
    }, delay)
  }

  send(type: string, data?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }

  on(type: string, h: Handler) {
    const set = this.handlers.get(type) || new Set()
    set.add(h)
    this.handlers.set(type, set)
    return () => set.delete(h)
  }

  subscribe(token: string, cb: Handler) {
    this.send('subscribe:tasks', { token })
    return this.on('task:update', cb)
  }

  close() {
    this.manualClose = true
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
