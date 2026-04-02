<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <span class="text-gray-500 dark:text-gray-400">共 {{ data.length }} 个隧道</span>
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
    <el-table :data="data" style="width: 100%" stripe v-loading="loading">
      <el-table-column prop="Id" label="ID" width="60" />
      <el-table-column label="名称" min-width="100">
        <template #default="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.Remark || row.Client?.Remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="Mode" label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small">{{ row.Mode || 'tcp' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="Port" label="端口" width="80">
        <template #default="{ row }">
          <span class="font-mono text-blue-600">{{ row.Port }}</span>
        </template>
      </el-table-column>
      <el-table-column label="目标地址" min-width="150">
        <template #default="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.Target?.TargetStr || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="客户端" width="100">
        <template #default="{ row }">
          <span class="text-gray-500">{{ row.Client?.Remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="NowConn" label="连接数" width="80">
        <template #default="{ row }">
          <span :class="row.NowConn > 0 ? 'text-green-600' : 'text-gray-400'">{{ row.NowConn || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="流量" min-width="100">
        <template #default="{ row }">
          <div class="text-xs">
            <div class="text-green-600">↑ {{ formatBytes(row.Flow?.ExportFlow) }}</div>
            <div class="text-blue-600">↓ {{ formatBytes(row.Flow?.InletFlow) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.Status ? 'success' : 'danger'" size="small">
            {{ row.Status ? '运行' : '停止' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.Status" type="warning" size="small" link @click="handleStop(row)">停止</el-button>
          <el-button v-else type="success" size="small" link @click="handleStart(row)">启动</el-button>
          <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑隧道' : '新增隧道'" width="500">
      <el-form :model="form" label-width="80px">
        <el-form-item label="客户端" required v-if="!isEdit">
          <el-select v-model="form.client_id" placeholder="选择客户端" class="w-full">
            <el-option v-for="client in clients" :key="client.Id" :label="client.Remark || `客户端${client.Id}`" :value="client.Id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" required v-if="!isEdit">
          <el-select v-model="form.type" placeholder="选择类型" class="w-full">
            <el-option label="TCP" value="tcp" />
            <el-option label="UDP" value="udp" />
            <el-option label="HTTP代理" value="httpProxy" />
            <el-option label="SOCKS5" value="socks5" />
          </el-select>
        </el-form-item>
        <el-form-item label="端口" required>
          <el-input-number v-model="form.port" :min="1" :max="65535" placeholder="服务器端口" class="w-full" />
        </el-form-item>
        <el-form-item label="目标地址" required>
          <el-input v-model="form.target" placeholder="如: 127.0.0.1:8080" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="隧道备注" />
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
import { ref, onMounted } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { npsApi, type NpsTunnel, type NpsClient } from '@/api/nps'
import { formatBytes } from '@/utils/format'

const props = defineProps<{
  data: NpsTunnel[]
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const clients = ref<NpsClient[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({
  id: 0,
  client_id: 0,
  type: 'tcp',
  port: 0,
  target: '',
  remark: ''
})

const fetchClients = async () => {
  try {
    const res = await npsApi.getClientList()
    clients.value = (res as any)?.data?.rows || []
  } catch (error) {
    console.error('获取客户端列表失败:', error)
    ElMessage.error((error as any)?.message || '获取客户端列表失败')
  }
}

onMounted(() => {
  fetchClients()
})

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: 0, client_id: 0, type: 'tcp', port: 0, target: '', remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: NpsTunnel) => {
  isEdit.value = true
  form.value = {
    id: row.Id,
    client_id: row.Client?.Id || 0,
    type: row.Mode || 'tcp',
    port: row.Port,
    target: row.Target?.TargetStr || '',
    remark: row.Remark || ''
  }
  dialogVisible.value = true
}

const handleDelete = (row: NpsTunnel) => {
  ElMessageBox.confirm(`确定要删除隧道「${row.Remark || row.Id}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await npsApi.deleteTunnel(row.Id)
      ElMessage.success('删除成功')
      emit('refresh')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleStart = async (row: NpsTunnel) => {
  try {
    await npsApi.startTunnel(row.Id)
    ElMessage.success('启动成功')
    emit('refresh')
  } catch (error) {
    ElMessage.error('启动失败')
  }
}

const handleStop = async (row: NpsTunnel) => {
  try {
    await npsApi.stopTunnel(row.Id)
    ElMessage.success('停止成功')
    emit('refresh')
  } catch (error) {
    ElMessage.error('停止失败')
  }
}

const handleSubmit = async () => {
  if (!isEdit.value && !form.value.client_id) {
    ElMessage.warning('请选择客户端')
    return
  }
  if (!form.value.port) {
    ElMessage.warning('请输入端口')
    return
  }
  if (!form.value.target) {
    ElMessage.warning('请输入目标地址')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await npsApi.editTunnel({ id: form.value.id, port: form.value.port, target: form.value.target, remark: form.value.remark })
      ElMessage.success('编辑成功')
    } else {
      await npsApi.addTunnel({ client_id: form.value.client_id, type: form.value.type, port: form.value.port, target: form.value.target, remark: form.value.remark })
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
