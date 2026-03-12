<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <span class="text-gray-500 dark:text-gray-400">共 {{ data.length }} 个客户端</span>
      <div class="flex gap-2">
        <el-button type="primary" size="small" @click="handleAdd">
          <Plus class="w-4 h-4 mr-1" />
          新增
        </el-button>
        <el-button size="small" @click="$emit('refresh')">
          <RefreshCw class="w-4 h-4 mr-1" />
          刷新
        </el-button>
      </div>
    </div>
    <el-table :data="data" style="width: 100%" stripe v-loading="loading" @expand-change="handleExpand">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="p-4 bg-gray-50 dark:bg-slate-700/50">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">启动命令</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-16 text-xs text-gray-500 dark:text-gray-400">TCP</span>
                <code class="flex-1 text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-600">{{ getCommand(row.VerifyKey, 'tcp') }}</code>
                <el-button size="small" @click="copyCommand(getCommand(row.VerifyKey, 'tcp'))">复制</el-button>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-xs text-gray-500 dark:text-gray-400">KCP</span>
                <code class="flex-1 text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-600">{{ getCommand(row.VerifyKey, 'kcp') }}</code>
                <el-button size="small" @click="copyCommand(getCommand(row.VerifyKey, 'kcp'))">复制</el-button>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-xs text-gray-500 dark:text-gray-400">TLS</span>
                <code class="flex-1 text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-600">{{ getCommand(row.VerifyKey, 'tls') }}</code>
                <el-button size="small" @click="copyCommand(getCommand(row.VerifyKey, 'tls'))">复制</el-button>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-xs text-gray-500 dark:text-gray-400">QUIC</span>
                <code class="flex-1 text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-600">{{ getCommand(row.VerifyKey, 'quic') }}</code>
                <el-button size="small" @click="copyCommand(getCommand(row.VerifyKey, 'quic'))">复制</el-button>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-xs text-gray-500 dark:text-gray-400">WS</span>
                <code class="flex-1 text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-600">{{ getCommand(row.VerifyKey, 'ws') }}</code>
                <el-button size="small" @click="copyCommand(getCommand(row.VerifyKey, 'ws'))">复制</el-button>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-xs text-gray-500 dark:text-gray-400">WSS</span>
                <code class="flex-1 text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-600">{{ getCommand(row.VerifyKey, 'wss') }}</code>
                <el-button size="small" @click="copyCommand(getCommand(row.VerifyKey, 'wss'))">复制</el-button>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="Id" label="ID" width="60" />
      <el-table-column prop="Remark" label="名称" min-width="100">
        <template #default="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.Remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="VerifyKey" label="验证密钥" min-width="150">
        <template #default="{ row }">
          <code class="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{{ row.VerifyKey }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="Addr" label="公网地址" min-width="120">
        <template #default="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.Addr }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="LocalAddr" label="内网地址" min-width="120">
        <template #default="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.LocalAddr }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.IsConnect ? 'success' : 'danger'" size="small">
            {{ row.IsConnect ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="NowConn" label="连接数" width="80">
        <template #default="{ row }">
          <span :class="row.NowConn > 0 ? 'text-green-600' : 'text-gray-400'">{{ row.NowConn }}</span>
        </template>
      </el-table-column>
      <el-table-column label="流量" min-width="100">
        <template #default="{ row }">
          <div class="text-xs">
            <div class="text-green-600">↑ {{ formatBytes(row.ExportFlow) }}</div>
            <div class="text-blue-600">↓ {{ formatBytes(row.InletFlow) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="Version" label="版本" width="80">
        <template #default="{ row }">
          <span class="text-gray-500 text-xs">{{ row.Version }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="LastOnlineTime" label="最后在线" width="150">
        <template #default="{ row }">
          <span class="text-gray-500 text-xs">{{ row.LastOnlineTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑客户端' : '新增客户端'" width="400">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.Remark" placeholder="请输入客户端名称" />
        </el-form-item>
        <el-form-item label="验证密钥">
          <el-input v-model="form.VerifyKey" placeholder="留空则自动生成" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { npsApi, type NpsClient } from '@/api/nps'
import { formatBytes } from '@/utils/format'

const props = defineProps<{
  data: NpsClient[]
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const SERVER_IP = '118.24.62.237'
const PORT_TCP = 8024
const PORT_TLS = 8025
const PORT_WS = 8026
const PORT_WSS = 8027

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({
  id: 0,
  Remark: '',
  VerifyKey: ''
})

const getCommand = (vkey: string, type: string) => {
  const commands: Record<string, string> = {
    tcp: `./npc -server="${SERVER_IP}:${PORT_TCP}" -vkey="${vkey}" -type="tcp"`,
    kcp: `./npc -server="${SERVER_IP}:${PORT_TCP}" -vkey="${vkey}" -type="kcp"`,
    tls: `./npc -server="${SERVER_IP}:${PORT_TLS}" -vkey="${vkey}" -type="tls"`,
    quic: `./npc -server="${SERVER_IP}:${PORT_TLS}" -vkey="${vkey}" -type="quic"`,
    ws: `./npc -server="${SERVER_IP}:${PORT_WS}/ws" -vkey="${vkey}" -type="ws"`,
    wss: `./npc -server="${SERVER_IP}:${PORT_WSS}/ws" -vkey="${vkey}" -type="wss"`
  }
  return commands[type] || ''
}

const copyCommand = async (command: string) => {
  try {
    await navigator.clipboard.writeText(command)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const handleExpand = (row: NpsClient, expandedRows: NpsClient[]) => {
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: 0, Remark: '', VerifyKey: '' }
  dialogVisible.value = true
}

const handleEdit = (row: NpsClient) => {
  isEdit.value = true
  form.value = { id: row.Id, Remark: row.Remark, VerifyKey: row.VerifyKey }
  dialogVisible.value = true
}

const handleDelete = (row: NpsClient) => {
  ElMessageBox.confirm(`确定要删除客户端「${row.Remark || row.Id}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await npsApi.deleteClient(row.Id)
      ElMessage.success('删除成功')
      emit('refresh')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!form.value.Remark) {
    ElMessage.warning('请输入客户端名称')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await npsApi.editClient({ id: form.value.id, Remark: form.value.Remark, VerifyKey: form.value.VerifyKey })
      ElMessage.success('编辑成功')
    } else {
      await npsApi.addClient({ Remark: form.value.Remark, VerifyKey: form.value.VerifyKey })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
  } finally {
    submitting.value = false
  }
}
</script>
