type Handler = (data: any) => void

class WsService {
  private ws: WebSocket | null = null
  private url: string
  private handlers = new Map<string, Set<Handler>>()

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
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => resolve()
      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        this.handlers.get(msg.type)?.forEach(h => h(msg.data ?? msg))
      }
      this.ws.onerror = (e) => reject(e)
      this.ws.onclose = () => { this.ws = null }
    })
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
}

export const wsService = new WsService()
