<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">菜单管理</h2>
        <AppButton variant="primary" size="sm" @click="openCreateDialog">
          <Plus class="w-4 h-4 mr-1" />
          新增菜单
        </AppButton>
      </div>
    </div>

    <el-card shadow="never" class="flex-1 min-h-0 overflow-auto !border-0 !rounded-xl !bg-white dark:!bg-slate-800 !shadow-md">
      <el-table :data="menuTree" style="width: 100%" v-loading="loading" row-key="_id" default-expand-all>
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="path" label="路径" min-width="180" />
        <el-table-column prop="icon" label="图标" width="120">
          <template #default="{ row }">
            <span v-if="row.icon">{{ row.icon }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row._id !== 'dashboard'">
              <el-button type="primary" link size="small" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row._id)">
                删除
              </el-button>
            </template>
            <span v-else class="text-gray-400 text-sm">系统菜单</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : '新增菜单'" width="500">
      <el-form :model="form" label-width="80px">
        <el-form-item label="菜单名称" required>
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路径" required>
          <el-input v-model="form.path" placeholder="请输入路径，如 /admin/users" />
        </el-form-item>
        <el-form-item label="图标">
          <IconPicker v-model="form.icon" />
        </el-form-item>
        <el-form-item label="父级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ label: 'name', value: '_id', children: 'children' }"
            clearable
            placeholder="请选择父级菜单"
            check-strictly
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppButton from '@/components/ui/AppButton.vue'
import IconPicker from '@/components/ui/IconPicker.vue'
import request from '@/api/request'

interface Menu {
  _id: string
  name: string
  path: string
  icon?: string
  parentId?: string
  sort: number
  status: string
  children?: Menu[]
  createdAt: string
}

const loading = ref(false)
const menus = ref<Menu[]>([])
const menuTree = computed(() => buildTree(menus.value))

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ name: '', path: '', icon: '', parentId: '', sort: 0, status: 'active' })
const editingId = ref('')

const menuOptions = computed(() => {
  const rootOption = { _id: '', name: '顶级菜单', children: menuTree.value }
  return [rootOption]
})

const buildTree = (items: Menu[], parentId: string | null = null): Menu[] => {
  return items
    .filter(item => String(item.parentId) === String(parentId))
    .sort((a, b) => a.sort - b.sort)
    .map(item => ({
      ...item,
      children: buildTree(items, item._id)
    }))
}

const loadMenus = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/menus')
    if (res?.success) {
      menus.value = res.data || []
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  isEdit.value = false
  form.value = { name: '', path: '', icon: '', parentId: '', sort: 0, status: 'active' }
  dialogVisible.value = true
}

const openEditDialog = (menu: Menu) => {
  isEdit.value = true
  editingId.value = menu._id
  form.value = {
    name: menu.name,
    path: menu.path,
    icon: menu.icon || '',
    parentId: menu.parentId || '',
    sort: menu.sort,
    status: menu.status
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.path) {
    ElMessage.warning('请填写菜单名称和路径')
    return
  }

  submitting.value = true
  try {
    const data = { ...form.value, parentId: form.value.parentId || null }
    
    if (isEdit.value) {
      const res: any = await request.put(`/admin/menus/${editingId.value}`, data)
      if (res?.success) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadMenus()
      }
    } else {
      const res: any = await request.post('/admin/menus', data)
      if (res?.success) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        loadMenus()
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
    await ElMessageBox.confirm('确定要删除该菜单吗？', '提示', { type: 'warning' })
    const res: any = await request.delete(`/admin/menus/${id}`)
    if (res?.success) {
      ElMessage.success('删除成功')
      loadMenus()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadMenus()
})
</script>
