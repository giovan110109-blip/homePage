<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">角色管理</h2>
        <AppButton variant="primary" size="sm" @click="openCreateDialog">
          <Plus class="w-4 h-4 mr-1" />
          新增角色
        </AppButton>
      </div>
    </div>

    <el-card shadow="never" class="flex-1 min-h-0 overflow-auto !border-0 !rounded-xl !bg-white dark:!bg-slate-800 !shadow-md">
      <el-table :data="roles" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="角色编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openMenuDialog(row)">
              分配菜单
            </el-button>
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row._id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          small
          @current-change="loadRoles"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="500">
      <el-form :model="form" label-width="80px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="form.code" placeholder="请输入角色编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="menuDialogVisible" title="分配菜单" width="500">
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        :props="{ label: 'name', children: 'children' }"
        show-checkbox
        node-key="_id"
        default-expand-all
        :default-checked-keys="selectedMenuIds"
      />
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveMenus" :loading="savingMenus">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppButton from '@/components/ui/AppButton.vue'
import request from '@/api/request'
import { formatDate } from '@/utils/format'

interface Role {
  _id: string
  name: string
  code: string
  description?: string
  status: string
  menuIds?: any[]
  createdAt: string
}

const loading = ref(false)
const roles = ref<Role[]>([])
const pagination = ref({ page: 1, pageSize: 10, total: 0 })

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ name: '', code: '', description: '', status: 'active' })
const editingId = ref('')

const menuDialogVisible = ref(false)
const menuTree = ref<any[]>([])
const selectedMenuIds = ref<string[]>([])
const savingMenus = ref(false)
const currentRoleId = ref('')
const menuTreeRef = ref()

const loadRoles = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/roles', {
      params: { page: pagination.value.page, limit: pagination.value.pageSize }
    })
    if (res?.success) {
      roles.value = res.data.data || []
      pagination.value.total = res.data.meta?.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadMenus = async () => {
  try {
    const res: any = await request.get('/admin/menus')
    if (res?.success) {
      menuTree.value = res.data || []
    }
  } catch (error) {
    console.error(error)
  }
}

const openCreateDialog = () => {
  isEdit.value = false
  form.value = { name: '', code: '', description: '', status: 'active' }
  dialogVisible.value = true
}

const openEditDialog = (role: Role) => {
  isEdit.value = true
  editingId.value = role._id
  form.value = {
    name: role.name,
    code: role.code,
    description: role.description || '',
    status: role.status
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.code) {
    ElMessage.warning('请填写角色名称和编码')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      const res: any = await request.put(`/admin/roles/${editingId.value}`, form.value)
      if (res?.success) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadRoles()
      }
    } else {
      const res: any = await request.post('/admin/roles', form.value)
      if (res?.success) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        loadRoles()
      }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', { type: 'warning' })
    const res: any = await request.delete(`/admin/roles/${id}`)
    if (res?.success) {
      ElMessage.success('删除成功')
      loadRoles()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const openMenuDialog = async (role: Role) => {
  currentRoleId.value = role._id
  await loadMenus()
  selectedMenuIds.value = (role.menuIds || []).map((m: any) => m._id || m)
  menuDialogVisible.value = true
}

const handleSaveMenus = async () => {
  const checkedIds = menuTreeRef.value?.getCheckedKeys() || []
  savingMenus.value = true
  try {
    const res: any = await request.put(`/admin/roles/${currentRoleId.value}/menus`, { menuIds: checkedIds })
    if (res?.success) {
      ElMessage.success('保存成功')
      menuDialogVisible.value = false
      loadRoles()
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingMenus.value = false
  }
}

onMounted(() => {
  loadRoles()
})
</script>
