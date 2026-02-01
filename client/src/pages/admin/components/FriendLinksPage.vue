<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">友情链接管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">管理和审核友情链接申请</p>
    </div>

    <el-card shadow="hover" class="h-full flex flex-col">
      <template #header>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span class="font-semibold text-gray-900 dark:text-white">友情链接列表</span>
          <div class="flex gap-3 flex-wrap">
            <el-select
              v-model="filter.form.status"
              placeholder="审核状态"
              clearable
              style="width: 140px"
              @change="loadData"
            >
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
            <el-select
              v-model="filter.form.category"
              placeholder="分类"
              clearable
              style="width: 140px"
              @change="loadData"
            >
              <el-option label="技术博客" value="tech" />
              <el-option label="设计" value="design" />
              <el-option label="生活" value="life" />
              <el-option label="工具" value="tools" />
              <el-option label="其他" value="other" />
            </el-select>
            <AppButton variant="primary" size="sm" @click="loadData">刷新</AppButton>
          </div>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading" style="width: 100%">
        <el-table-column label="头像" width="80">
          <template #default="scope">
            <img
              v-if="scope.row.avatar"
              :src="scope.row.avatar"
              :alt="scope.row.name"
              class="w-12 h-12 rounded-lg object-cover"
            />
            <div
              v-else
              class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold"
            >
              {{ scope.row.name?.charAt(0).toUpperCase() || '?' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="网站名称" width="150"></el-table-column>
        
        <el-table-column label="网站链接" min-width="250">
          <template #default="scope">
            <a :href="scope.row.url" target="_blank" class="text-blue-500 hover:underline flex items-center gap-1">
              {{ scope.row.url }}
              <ExternalLink class="w-3 h-3" />
            </a>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        
        <el-table-column prop="email" label="邮箱" width="180"></el-table-column>
        
        <el-table-column label="分类" width="100">
          <template #default="scope">
            <el-tag :type="getCategoryTagType(scope.row.category)" size="small">
              {{ getCategoryLabel(scope.row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="getStatusTagType(scope.row.status)" 
              size="small"
            >
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="显示" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.isActive"
              @change="handleToggleActive(scope.row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="clicks" label="点击" width="80"></el-table-column>
        
        <el-table-column prop="sort" label="排序" width="80">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.sort"
              :min="0"
              :max="999"
              size="small"
              controls-position="right"
              @change="handleSortChange(scope.row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <div class="flex gap-2">
              <AppButton
                v-if="scope.row.status === 'pending'"
                variant="success"
                size="sm"
                @click="handleReview(scope.row, 'approved')"
              >
                通过
              </AppButton>
              <AppButton
                v-if="scope.row.status === 'pending'"
                variant="danger"
                size="sm"
                @click="handleReject(scope.row)"
              >
                拒绝
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                @click="handleEdit(scope.row)"
              >
                编辑
              </AppButton>
              <AppButton
                variant="danger"
                size="sm"
                @click="handleDelete(scope.row)"
              >
                删除
              </AppButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-6 flex justify-end">
        <el-pagination
          v-model:current-page="filter.form.page"
          v-model:page-size="filter.form.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝友情链接" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <AppButton variant="reset" size="sm" @click="rejectDialogVisible = false">取消</AppButton>
        <AppButton variant="danger" size="sm" @click="confirmReject">确认拒绝</AppButton>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑友情链接" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="网站名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="网站链接">
          <el-input v-model="editForm.url" />
        </el-form-item>
        <el-form-item label="网站描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="头像 URL">
          <el-input v-model="editForm.avatar" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="RSS">
          <el-input v-model="editForm.rss" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" style="width: 100%">
            <el-option label="技术博客" value="tech" />
            <el-option label="设计" value="design" />
            <el-option label="生活" value="life" />
            <el-option label="工具" value="tools" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="editForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="是否显示">
          <el-switch v-model="editForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <AppButton variant="reset" size="sm" @click="editDialogVisible = false">取消</AppButton>
        <AppButton variant="primary" size="sm" @click="confirmEdit">保存</AppButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ExternalLink } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import {
  adminGetFriendLinks,
  adminReviewFriendLink,
  adminUpdateFriendLink,
  adminDeleteFriendLink
} from '@/api/friendLink'
import { useMessageFilterForm } from '@/composables/useMessageFilterForm'
import type { FriendLink } from '@/types/api'

const filter = useMessageFilterForm({ pageSize: 20, status: '', category: '' })
const loading = ref(false)
const tableData = ref<FriendLink[]>([])
const total = ref(0)

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectForm = ref({ reason: '', id: '' })

// 编辑对话框
const editDialogVisible = ref(false)
const editForm = ref<Partial<FriendLink>>({})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await adminGetFriendLinks(filter.toParams())
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 审核通过
const handleReview = async (row: FriendLink, status: 'approved' | 'rejected') => {
  try {
    await adminReviewFriendLink(row._id, { status })
    ElMessage.success('审核成功')
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 拒绝
const handleReject = (row: FriendLink) => {
  rejectForm.value = { reason: '', id: row._id }
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await adminReviewFriendLink(rejectForm.value.id, {
      status: 'rejected',
      reason: rejectForm.value.reason
    })
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 编辑
const handleEdit = (row: FriendLink) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  try {
    await adminUpdateFriendLink(editForm.value._id!, editForm.value)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 删除
const handleDelete = async (row: FriendLink) => {
  try {
    await ElMessageBox.confirm(`确定删除 "${row.name}" 吗？`, '确认删除', {
      type: 'warning'
    })
    await adminDeleteFriendLink(row._id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 切换显示状态
const handleToggleActive = async (row: FriendLink) => {
  try {
    await adminUpdateFriendLink(row._id, { isActive: row.isActive })
    ElMessage.success('更新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
    row.isActive = !row.isActive // 回滚
  }
}

// 更新排序
const handleSortChange = async (row: FriendLink) => {
  try {
    await adminUpdateFriendLink(row._id, { sort: row.sort })
    ElMessage.success('排序已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 工具函数
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const getStatusTagType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || ''
}

const getCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    tech: '技术',
    design: '设计',
    life: '生活',
    tools: '工具',
    other: '其他'
  }
  return map[category] || category
}

const getCategoryTagType = (category: string) => {
  const map: Record<string, any> = {
    tech: '',
    design: 'success',
    life: 'warning',
    tools: 'info',
    other: ''
  }
  return map[category] || ''
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
:deep(.el-table) {
  @apply text-gray-900 dark:text-white;
}
</style>
