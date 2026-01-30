<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">赞助管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">管理赞助记录与赞助方式</p>
    </div>

    <el-card shadow="hover">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="赞助记录" name="records">
          <div class="flex justify-end gap-3 mb-4">
            <el-button type="primary" @click="openSponsorDialog()">新增记录</el-button>
            <el-button plain @click="() => fetchSponsors(filter.toParams())">刷新</el-button>
          </div>

          <el-table :data="sponsors" stripe v-loading="loadingSponsors">
            <el-table-column prop="name" label="赞助者" width="140" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="scope">{{ formatAmount(scope.row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="method" label="方式" width="160">
              <template #default="scope">
                {{ scope.row.method?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="message" label="寄语" min-width="240" />
            <el-table-column prop="date" label="日期" width="160">
              <template #default="scope">{{ formatDate(scope.row.date || scope.row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="scope">
                <el-button link type="primary" size="small" @click="openSponsorDialog(scope.row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteSponsor(scope.row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无赞助记录" />
            </template>
          </el-table>

          <div class="mt-6 flex justify-center">
            <el-pagination
              v-model:current-page="filter.form.page"
              v-model:page-size="filter.form.pageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              :total="sponsorTotal"
              @size-change="() => fetchSponsors(filter.toParams())"
              @current-change="() => fetchSponsors(filter.toParams())"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="赞助方式" name="methods">
          <div class="card-toolbar">
            <el-button type="primary" @click="openMethodDialog()">新增方式</el-button>
            <el-button plain @click="fetchMethods">刷新</el-button>
          </div>

          <el-table :data="methods" stripe v-loading="loadingMethods">
            <el-table-column prop="name" label="名称" width="160" />
            <el-table-column prop="icon" label="图标" width="120">
              <template #default="scope">
                <img v-if="scope.row.icon" :src="scope.row.icon" alt="icon" class="w-9 h-9 rounded object-cover" />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="qrCode" label="二维码" width="140">
              <template #default="scope">
                <img v-if="scope.row.qrCode" :src="scope.row.qrCode" alt="qr" class="w-9 h-9 rounded object-cover" />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column prop="enabled" label="启用" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.enabled ? 'success' : 'info'">
                  {{ scope.row.enabled ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="scope">
                <el-button link type="primary" size="small" @click="openMethodDialog(scope.row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteMethod(scope.row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无赞助方式" />
            </template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="sponsorDialogVisible" :title="sponsorForm._id ? '编辑记录' : '新增记录'" width="520px">
      <el-form :model="sponsorForm" label-width="90px">
        <el-form-item label="赞助者" required>
          <el-input v-model="sponsorForm.name" />
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number v-model="sponsorForm.amount" :min="0" :precision="2" class="w-full" />
        </el-form-item>
        <el-form-item label="方式">
          <el-select v-model="sponsorForm.method" placeholder="选择方式" clearable class="w-full">
            <el-option v-for="item in methods" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="sponsorForm.date" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </el-form-item>
        <el-form-item label="寄语">
          <el-input v-model="sponsorForm.message" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sponsorDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingSponsor" @click="saveSponsor">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="methodDialogVisible" :title="methodForm._id ? '编辑方式' : '新增方式'" width="520px">
      <el-form :model="methodForm" label-width="90px">
        <el-form-item label="名称" required>
          <el-input v-model="methodForm.name" />
        </el-form-item>
        <el-form-item label="图标">
          <ImageUpload 
            v-model="methodForm.icon" 
            placeholder="上传图标"
            :max-size="2"
            tip="建议尺寸：128x128px，支持 PNG/JPG，不超过 2MB"
          />
        </el-form-item>
        <el-form-item label="二维码">
          <ImageUpload 
            v-model="methodForm.qrCode" 
            placeholder="上传二维码"
            :max-size="2"
            tip="建议尺寸：400x400px，支持 PNG/JPG，不超过 2MB"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="methodForm.description" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="methodForm.sort" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="methodForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="methodDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingMethod" @click="saveMethod">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { useMessageFilterForm } from '@/composables/useMessageFilterForm'
import { useTableFetch } from '@/composables/useTableFetch'
import ImageUpload from '@/components/ui/ImageUpload.vue'

interface SponsorMethod {
  _id?: string
  name: string
  icon?: string
  qrCode?: string
  description?: string
  sort?: number
  enabled?: boolean
}

interface SponsorRecord {
  _id?: string
  name: string
  amount: number
  message?: string
  date?: string
  createdAt?: string
  method?: SponsorMethod | string
}

const activeTab = ref('records')
const methods = ref<SponsorMethod[]>([])
const filter = useMessageFilterForm({ pageSize: 10 })
const { 
  data: sponsors, 
  total: sponsorTotal, 
  loading: loadingSponsors,
  fetch: fetchSponsors 
} = useTableFetch<SponsorRecord>(
  (params) => request.get('/admin/sponsors', { params })
)

const sponsorDialogVisible = ref(false)
const methodDialogVisible = ref(false)

const sponsorForm = ref<SponsorRecord>({
  name: '',
  amount: 0,
  message: '',
  date: '',
  method: '',
})

const methodForm = ref<SponsorMethod>({
  name: '',
  icon: '',
  qrCode: '',
  description: '',
  sort: 0,
  enabled: true,
})

const loadingMethods = ref(false)
const savingMethod = ref(false)
const savingSponsor = ref(false)

const fetchMethods = async () => {
  loadingMethods.value = true
  try {
    const res = await request.get('/admin/sponsor-methods')
    const payload = (res as any)?.data || res || {}
    methods.value = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : [])
  } catch (error: any) {
    ElMessage.error(error?.message || '获取赞助方式失败')
  } finally {
    loadingMethods.value = false
  }
}

const openSponsorDialog = (row?: SponsorRecord) => {
  sponsorForm.value = row
    ? {
        _id: row._id,
        name: row.name,
        amount: row.amount,
        message: row.message || '',
        date: row.date ? row.date.slice(0, 10) : (row.createdAt ? row.createdAt.slice(0, 10) : ''),
        method: typeof row.method === 'string' ? row.method : row.method?._id,
      }
    : { name: '', amount: 0, message: '', date: '', method: '' }
  sponsorDialogVisible.value = true
}

const saveSponsor = async () => {
  if (!sponsorForm.value.name) {
    ElMessage.warning('请输入赞助者姓名')
    return
  }
  savingSponsor.value = true
  try {
    const payload = { ...sponsorForm.value }
    const id = payload._id
    delete (payload as any)._id
    if (id) {
      await request.put(`/admin/sponsors/${id}`, payload)
    } else {
      await request.post('/admin/sponsors', payload)
    }
    ElMessage.success('保存成功')
    sponsorDialogVisible.value = false
    await fetchSponsors(filter.toParams())
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    savingSponsor.value = false
  }
}

const deleteSponsor = async (row: SponsorRecord) => {
  try {
    await ElMessageBox.confirm(`确定删除赞助记录「${row.name}」吗？`, '提示', { type: 'warning' })
    await request.delete(`/admin/sponsors/${row._id}`)
    ElMessage.success('删除成功')
    await fetchSponsors(filter.toParams())
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const openMethodDialog = (row?: SponsorMethod) => {
  methodForm.value = row
    ? { ...row }
    : { name: '', icon: '', qrCode: '', description: '', sort: 0, enabled: true }
  methodDialogVisible.value = true
}

const saveMethod = async () => {
  if (!methodForm.value.name) {
    ElMessage.warning('请输入方式名称')
    return
  }
  savingMethod.value = true
  try {
    const payload = { ...methodForm.value }
    const id = payload._id
    delete (payload as any)._id
    if (id) {
      await request.put(`/admin/sponsor-methods/${id}`, payload)
    } else {
      await request.post('/admin/sponsor-methods', payload)
    }
    ElMessage.success('保存成功')
    methodDialogVisible.value = false
    await fetchMethods()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    savingMethod.value = false
  }
}

const deleteMethod = async (row: SponsorMethod) => {
  try {
    await ElMessageBox.confirm(`确定删除方式「${row.name}」吗？`, '提示', { type: 'warning' })
    await request.delete(`/admin/sponsor-methods/${row._id}`)
    ElMessage.success('删除成功')
    await fetchMethods()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

const formatAmount = (value?: number) => {
  if (value === undefined || value === null) return '-'
  return `${Number(value).toFixed(2)} 元`
}

onMounted(() => {
  fetchMethods()
  fetchSponsors(filter.toParams())
})
</script>
