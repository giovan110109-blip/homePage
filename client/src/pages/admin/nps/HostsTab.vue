<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <span class="text-gray-500 dark:text-gray-400">共 {{ data.length }} 个域名</span>
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
      <el-table-column prop="Host" label="域名" min-width="150">
        <template #default="{ row }">
          <a :href="`${row.Scheme}://${row.Host}`" target="_blank" class="text-blue-600 hover:underline">{{ row.Host }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="Scheme" label="协议" width="80">
        <template #default="{ row }">
          <el-tag :type="row.Scheme === 'https' ? 'success' : 'info'" size="small">{{ row.Scheme }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标地址" min-width="150">
        <template #default="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.Target?.TargetStr || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="Remark" label="备注" min-width="100">
        <template #default="{ row }">
          <span class="text-gray-500">{{ row.Remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="客户端" width="100">
        <template #default="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.Client?.Remark || '-' }}</span>
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
          <el-tag :type="row.Status === false ? 'danger' : 'success'" size="small">
            {{ row.Status === false ? '禁用' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑域名解析' : '新增域名解析'" width="500">
      <el-form :model="form" label-width="80px">
        <el-form-item label="客户端" required v-if="!isEdit">
          <el-select v-model="form.client_id" placeholder="选择客户端" class="w-full">
            <el-option v-for="client in clients" :key="client.Id" :label="client.Remark || `客户端${client.Id}`" :value="client.Id" />
          </el-select>
        </el-form-item>
        <el-form-item label="域名" required>
          <el-input v-model="form.host" placeholder="如: example.com" />
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="form.scheme" class="w-full">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标地址" required>
          <el-input v-model="form.target" placeholder="如: 127.0.0.1:8080" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="域名备注" />
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
import { npsApi, type NpsHost, type NpsClient } from '@/api/nps'
import { formatBytes } from '@/utils/format'

const props = defineProps<{
  data: NpsHost[]
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
  host: '',
  scheme: 'http',
  target: '',
  remark: ''
})

const fetchClients = async () => {
  try {
    const res = await npsApi.getClientList()
    clients.value = (res as any)?.data?.rows || []
  } catch (error) {
    console.error('获取客户端列表失败:', error)
  }
}

onMounted(() => {
  fetchClients()
})

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: 0, client_id: 0, host: '', scheme: 'http', target: '', remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: NpsHost) => {
  isEdit.value = true
  form.value = {
    id: row.Id,
    client_id: row.Client?.Id || 0,
    host: row.Host,
    scheme: row.Scheme || 'http',
    target: row.Target?.TargetStr || '',
    remark: row.Remark || ''
  }
  dialogVisible.value = true
}

const handleDelete = (row: NpsHost) => {
  ElMessageBox.confirm(`确定要删除域名解析「${row.Host}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await npsApi.deleteHost(row.Id)
      ElMessage.success('删除成功')
      emit('refresh')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!isEdit.value && !form.value.client_id) {
    ElMessage.warning('请选择客户端')
    return
  }
  if (!form.value.host) {
    ElMessage.warning('请输入域名')
    return
  }
  if (!form.value.target) {
    ElMessage.warning('请输入目标地址')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await npsApi.editHost({ id: form.value.id, host: form.value.host, scheme: form.value.scheme, target: form.value.target, remark: form.value.remark })
      ElMessage.success('编辑成功')
    } else {
      await npsApi.addHost({ client_id: form.value.client_id, host: form.value.host, scheme: form.value.scheme, target: form.value.target, remark: form.value.remark })
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
