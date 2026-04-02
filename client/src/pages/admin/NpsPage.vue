<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">内网穿透管理</h1>
      <p class="text-gray-500 dark:text-gray-400">管理 NPS 内网穿透客户端和隧道</p>
    </div>

    <div v-if="statsLoading" class="flex items-center justify-center h-32">
      <div class="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">服务器信息</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">服务器 IP</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">{{ stats?.serverIp || '-' }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">版本</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">{{ stats?.version || '-' }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">运行时间</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">{{ stats?.upTime || '-' }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">CPU</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">{{ stats?.cpu || 0 }}%</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">内存</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">{{ stats?.virtual_mem || 0 }}%</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Bridge</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">{{ stats?.bridgePort || '-' }} / {{ stats?.bridgeType || '-' }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">在线客户端</p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats?.clientOnlineCount || 0 }} / {{ stats?.clientCount || 0 }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">TCP 隧道</p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats?.tcpCount || 0 }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">域名解析</p>
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ stats?.hostCount || 0 }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">流量统计</p>
          <div class="text-sm">
            <span class="text-green-600">↑ {{ formatBytes(stats?.exportFlowCount) }}</span>
            <span class="text-gray-400 mx-1">/</span>
            <span class="text-blue-600">↓ {{ formatBytes(stats?.inletFlowCount) }}</span>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4" @tab-change="handleTabChange">
        <el-tab-pane label="客户端" name="clients">
          <ClientsTab v-if="loadedTabs.clients" :data="clientsData" :loading="clientsLoading" @refresh="fetchClients" />
        </el-tab-pane>

        <el-tab-pane label="隧道" name="tunnels">
          <TunnelsTab v-if="loadedTabs.tunnels" :data="tunnelsData" :loading="tunnelsLoading" @refresh="fetchTunnels" />
        </el-tab-pane>

        <el-tab-pane label="域名解析" name="hosts">
          <HostsTab v-if="loadedTabs.hosts" :data="hostsData" :loading="hostsLoading" @refresh="fetchHosts" />
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { npsApi, type NpsClient, type NpsTunnel, type NpsHost } from '@/api/nps'
import { formatBytes } from '@/utils/format'

const ClientsTab = defineAsyncComponent(() => import('./nps/ClientsTab.vue'))
const TunnelsTab = defineAsyncComponent(() => import('./nps/TunnelsTab.vue'))
const HostsTab = defineAsyncComponent(() => import('./nps/HostsTab.vue'))

interface NpsStats {
  clientCount: number
  clientOnlineCount: number
  tcpCount: number
  hostCount: number
  upTime: string
  version: string
  serverIp: string
  cpu: number
  virtual_mem: number
  tcp: number
  udp: number
  inletFlowCount: number
  exportFlowCount: number
  httpProxyPort: string
  httpsProxyPort: string
  bridgePort: number
  bridgeType: string
}

const statsLoading = ref(true)
const clientsLoading = ref(false)
const tunnelsLoading = ref(false)
const hostsLoading = ref(false)

const activeTab = ref('clients')
const stats = ref<NpsStats | null>(null)

const clientsData = ref<NpsClient[]>([])
const tunnelsData = ref<NpsTunnel[]>([])
const hostsData = ref<NpsHost[]>([])

const loadedTabs = reactive({
  clients: false,
  tunnels: false,
  hosts: false
})

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await npsApi.getStats()
    stats.value = (res as any)?.data?.data || {}
  } catch (error) {
    console.error('获取统计信息失败:', error)
  } finally {
    statsLoading.value = false
  }
}

const fetchClients = async () => {
  clientsLoading.value = true
  try {
    const res = await npsApi.getClientList()
    clientsData.value = (res as any)?.data?.rows || []
  } catch (error) {
    console.error('获取客户端列表失败:', error)
    ElMessage.error((error as any)?.message || '获取客户端列表失败')
  } finally {
    clientsLoading.value = false
  }
}

const fetchTunnels = async () => {
  tunnelsLoading.value = true
  try {
    const res = await npsApi.getTunnelList({ type: 'tcp' })
    tunnelsData.value = (res as any)?.data?.rows || []
  } catch (error) {
    console.error('获取隧道列表失败:', error)
    ElMessage.error((error as any)?.message || '获取隧道列表失败')
  } finally {
    tunnelsLoading.value = false
  }
}

const fetchHosts = async () => {
  hostsLoading.value = true
  try {
    const res = await npsApi.getHostList()
    hostsData.value = (res as any)?.data?.rows || []
  } catch (error) {
    console.error('获取域名解析列表失败:', error)
    ElMessage.error((error as any)?.message || '获取域名解析列表失败')
  } finally {
    hostsLoading.value = false
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'clients' && !loadedTabs.clients) {
    loadedTabs.clients = true
    fetchClients()
  } else if (tab === 'tunnels' && !loadedTabs.tunnels) {
    loadedTabs.tunnels = true
    fetchTunnels()
  } else if (tab === 'hosts' && !loadedTabs.hosts) {
    loadedTabs.hosts = true
    fetchHosts()
  }
}

onMounted(async () => {
  await fetchStats()
  loadedTabs.clients = true
  fetchClients()
})
</script>
