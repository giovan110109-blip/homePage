import request from './request'

export interface NpsClient {
  Id: number
  VerifyKey: string
  Remark: string
  Status: boolean
  IsConnect: boolean
  Addr: string
  LocalAddr: string
  Mode: string
  Version: string
  Flow: {
    ExportFlow: number
    InletFlow: number
    FlowLimit: number
  }
  RateLimit: number
  MaxConn: number
  NowConn: number
  CreateTime: string
  LastOnlineTime: string
  ExportFlow: number
  InletFlow: number
}

export interface NpsTunnel {
  Id: number
  ClientId: number
  Port: number
  Mode: string
  Target: {
    TargetStr: string
    TargetArr: string[]
  }
  Client: {
    Id: number
    Remark: string
  }
  Status: boolean
  Run: boolean
  Remark: string
  NowConn: number
  Flow: {
    ExportFlow: number
    InletFlow: number
  }
}

export interface NpsStats {
  clientCount: number
  clientOnlineCount: number
  tunnelCount: number
  tcpCount: number
  udpCount: number
  httpProxyCount: number
  socks5Count: number
  secretCount: number
  p2pCount: number
  hostCount: number
  version: string
  upTime: string
  cpu: number
  virtual_mem: number
  io_recv: number
  io_send: number
}

export interface NpsClientListResponse {
  addr: string
  bridgePort: number
  bridgeType: string
  ip: string
  rows: NpsClient[]
  total: number
}

export interface NpsHost {
  Id: number
  Host: string
  Remark: string
  Scheme: string
  Location: string
  Target: {
    TargetStr: string
    TargetArr: string[]
  }
  Client: {
    Id: number
    Remark: string
  }
  Flow: {
    ExportFlow: number
    InletFlow: number
  }
  NowConn: number
  Status: boolean
}

export const npsApi = {
  getClientList: (params?: { search?: string; offset?: number; limit?: number }) =>
    request.post<NpsClientListResponse>('/nps/client/list', params),

  getTunnelList: (params?: { client_id?: number; type?: string; search?: string; offset?: number; limit?: number }) =>
    request.post<{ rows: NpsTunnel[]; total: number }>('/nps/tunnel/list', params),

  getHostList: (params?: { search?: string; offset?: number; limit?: number; client_id?: number }) =>
    request.post<{ rows: NpsHost[]; total: number }>('/nps/host/list', params),

  getStats: () =>
    request.post<{ code: number; data: NpsStats }>('/nps/dashboard/stats'),

  getServerTime: () =>
    request.post<{ time: number }>('/nps/auth/gettime'),

  addClient: (data: { Remark: string; VerifyKey?: string }) =>
    request.post('/nps/client/add', data),

  editClient: (data: { id: number; Remark?: string; VerifyKey?: string }) =>
    request.post('/nps/client/edit', data),

  deleteClient: (id: number) =>
    request.post('/nps/client/delete', { id }),

  addTunnel: (data: { client_id: number; type: string; port: number; target: string; remark?: string }) =>
    request.post('/nps/tunnel/add', data),

  editTunnel: (data: { id: number; port?: number; target?: string; remark?: string }) =>
    request.post('/nps/tunnel/edit', data),

  deleteTunnel: (id: number) =>
    request.post('/nps/tunnel/delete', { id }),

  startTunnel: (id: number) =>
    request.post('/nps/tunnel/start', { id }),

  stopTunnel: (id: number) =>
    request.post('/nps/tunnel/stop', { id }),

  addHost: (data: { client_id: number; host: string; scheme?: string; target: string; remark?: string }) =>
    request.post('/nps/host/add', data),

  editHost: (data: { id: number; host?: string; scheme?: string; target?: string; remark?: string }) =>
    request.post('/nps/host/edit', data),

  deleteHost: (id: number) =>
    request.post('/nps/host/delete', { id }),
}
