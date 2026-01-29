<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">访问记录</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">查看网站访问日志</p>
    </div>

    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
          <span>访问列表</span>
          <el-button type="primary" @click="handleFetch">刷新</el-button>
        </div>
      </template>

      <el-table :data="logs" stripe v-loading="loading">
        <el-table-column prop="ip" label="IP" width="150" />
        <el-table-column label="位置" min-width="180">
          <template #default="scope">
            {{ formatLocation(scope.row.location) }}
          </template>
        </el-table-column>
        <el-table-column prop="os" label="操作系统" width="140">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <component :is="getOsIcon(scope.row.os)" class="w-3.5 h-3.5 text-gray-500" />
              {{ scope.row.os || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="browser" label="浏览器" width="140">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <Globe class="w-3.5 h-3.5 text-gray-500" />
              {{ scope.row.browser || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deviceType" label="设备" width="120">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <component :is="getDeviceIcon(scope.row.deviceType)" class="w-3.5 h-3.5 text-gray-500" />
              {{ scope.row.deviceType || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="200" />
        <el-table-column prop="status" label="状态" width="90" />
        <el-table-column prop="duration" label="耗时(ms)" width="110" />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-6 flex justify-center">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleFetch"
          @current-change="handleFetch"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import { Globe, Monitor, Smartphone, Apple, Laptop } from 'lucide-vue-next'
import { useTableFetch } from '@/composables/useTableFetch'

interface AccessLog {
  _id: string
  ip?: string
  path?: string
  method?: string
  status?: number
  duration?: number
  userAgent?: string
  browser?: string
  os?: string
  deviceType?: string
  referer?: string
  language?: string
  createdAt?: string
  location?: {
    city?: string
    region?: string
    country?: string
    isp?: string
  }
}

const query = ref({ page: 1, pageSize: 20 })

const { data: logs, total, loading, fetch } = useTableFetch<AccessLog, Record<string, any>>(
  (params) => request.get('/admin/access-logs', { params })
)

const handleFetch = async () => {
  try {
    await fetch(query.value)
  } catch (error: any) {
    ElMessage.error(error?.message || '加载访问记录失败')
  }
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const formatLocation = (location?: AccessLog['location']) => {
  if (!location) return '-'
  const parts = [location.country, location.region, location.city].filter(Boolean)
  return parts.length ? parts.join(' / ') : '-'
}

const getOsIcon = (os?: string) => {
  const value = (os || '').toLowerCase()
  if (value.includes('mac') || value.includes('os x') || value.includes('ios')) return Apple
  if (value.includes('windows') || value.includes('win')) return Laptop
  return Monitor
}

const getDeviceIcon = (device?: string) => {
  const value = (device || '').toLowerCase()
  if (value.includes('mobile') || value.includes('phone')) return Smartphone
  if (value.includes('desktop') || value.includes('pc')) return Monitor
  return Monitor
}

onMounted(() => {
  handleFetch()
})
</script>
