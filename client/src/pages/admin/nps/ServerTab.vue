<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">服务器 IP</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.serverIp || '-' }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">版本</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.version || '-' }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">CPU 使用率</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.cpu || 0 }}%</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">内存使用</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.virtual_mem || 0 }}%</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">TCP 连接数</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.tcp || 0 }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">UDP 连接数</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.udp || 0 }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">入站流量</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ formatBytes(data?.inletFlowCount) }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">出站流量</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ formatBytes(data?.exportFlowCount) }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">HTTP 代理端口</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.httpProxyPort || '-' }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">HTTPS 代理端口</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.httpsProxyPort || '-' }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Bridge 端口</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.bridgePort || '-' }}</p>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Bridge 类型</p>
      <p class="font-medium text-gray-900 dark:text-white">{{ data?.bridgeType || '-' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatBytes } from '@/utils/format'

interface NpsStats {
  serverIp?: string
  version?: string
  cpu?: number
  virtual_mem?: number
  tcp?: number
  udp?: number
  inletFlowCount?: number
  exportFlowCount?: number
  httpProxyPort?: string
  httpsProxyPort?: string
  bridgePort?: number
  bridgeType?: string
}

defineProps<{
  data: NpsStats | null
}>()
</script>
