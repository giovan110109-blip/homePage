<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <!-- 页面头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">管理系统中的所有用户</p>
      </div>
      <AppButton
        variant="primary"
        size="sm"
        @click="handleAddUser"
      >
        <Plus class="w-5 h-5" />
        添加用户
      </AppButton>
    </div>

    <!-- 用户列表卡片 -->
    <el-card shadow="hover" class="h-full flex flex-col">
      <template #header>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span class="font-semibold text-gray-900 dark:text-white">用户列表</span>
          <div class="flex gap-3 flex-wrap">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户..."
              clearable
              style="width: 220px; height: 32px"
              @change="handleSearch"
            />
            <el-select
              v-model="filterRole"
              placeholder="角色"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="用户" value="user" />
            </el-select>
            <el-select
              v-model="filterStatus"
              placeholder="状态"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="活跃" value="active" />
              <el-option label="禁用" value="disabled" />
            </el-select>
            <AppButton variant="primary" size="sm" @click="handleSearch">查询</AppButton>
            <AppButton variant="reset" size="sm" @click="handleReset">重置</AppButton>
          </div>
        </div>
      </template>

      <!-- 表格 -->
      <el-table :data="users" stripe v-loading="loading" class="flex-1">
        <el-table-column prop="username" label="用户名" min-width="130">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <img
                v-if="scope.row.avatar"
                :src="scope.row.avatar"
                :alt="scope.row.username"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold"
              >
                {{ scope.row.username.charAt(0).toUpperCase() }}
              </div>
              <span class="font-medium">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="160"></el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="130"></el-table-column>
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">
              {{ scope.row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'warning'">
              {{ scope.row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEditUser(scope.row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleResetPassword(scope.row)">重密</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <template #footer>
        <div class="flex justify-end">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @change="loadUsers"
          />
        </div>
      </template>
    </el-card>

    <!-- 编辑/创建对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingUser ? '编辑用户' : '添加用户'"
      width="500px"
      @close="resetForm"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            :disabled="!!editingUser"
            clearable
          />
        </el-form-item>

        <el-form-item v-if="!editingUser" label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="formData.nickname"
            placeholder="请输入昵称"
            clearable
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱"
            type="email"
            clearable
          />
        </el-form-item>

        <el-form-item label="头像">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div class="relative w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity group border-2 border-indigo-300/50 dark:border-slate-600">
              <img v-if="formData.avatar" :src="formData.avatar" class="w-full h-full object-cover" />
              <User v-else class="w-8 h-8 text-white" />
              <input 
                type="file"
                accept="image/*"
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                @change="handleAvatarUpload"
              />
              <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span class="text-white text-xs font-semibold">上传</span>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-sm text-slate-600 dark:text-slate-400">点击头像上传新图片</span>
              <span class="text-xs text-slate-500">建议尺寸：200x200，大小 &lt; 2MB</span>
              <AppButton v-if="formData.avatar" variant="ghost-danger" size="xs" @click="formData.avatar = ''">
                删除头像
              </AppButton>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入电话号码"
            clearable
          />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="formData.gender" placeholder="选择性别" class="w-full">
            <el-option label="未知" value="unknown" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="选择角色" class="w-full">
            <el-option label="管理员" value="admin" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="选择状态" class="w-full">
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUser" :loading="saving">
          {{ editingUser ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="400px"
      @close="resetPasswordForm = ''"
      destroy-on-close
    >
      <el-form ref="resetPasswordFormRef" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetPasswordForm"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmResetPassword" :loading="saving">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import request from '@/api/request'
import { getAssetURL } from '@/utils'

interface User {
  _id: string
  username: string
  email?: string
  nickname?: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled'
  createdAt: string
}

// 状态
const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索和过滤
const searchKeyword = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// 编辑/创建对话框
const dialogVisible = ref(false)
const formRef = ref()
const editingUser = ref<User | null>(null)
const formData = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  avatar: '',
  phone: '',
  gender: 'unknown' as const,
  role: 'user' as 'admin' | 'user',
  status: 'active' as 'active' | 'disabled'
})

// 重置密码
const resetPasswordDialogVisible = ref(false)
const resetPasswordFormRef = ref()
const resetPasswordForm = ref('')
const resetPasswordUserId = ref('')

// 验证规则
const rules = {
  username: [
    { required: true, message: '用户名必填', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码必填', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '昵称必填', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/users', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value,
        role: filterRole.value || undefined,
        status: filterStatus.value || undefined
      }
    })

    if (res.success) {
      users.value = res.data
      total.value = res.pagination?.total || 0
    }
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

// 重置
const handleReset = () => {
  searchKeyword.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  loadUsers()
}

// 头像上传验证
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传处理
const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件
  if (!beforeAvatarUpload(file)) {
    return
  }

  // 创建FormData
  const uploadFormData = new FormData()
  uploadFormData.append('file', file)

  try {
    const res: any = await request.post('/upload', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const data = res?.data || res
    if (data?.url) {
      formData.avatar = getAssetURL(data.url)
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(res?.message || '上传失败')
    }
    // 重置input
    input.value = ''
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  }
}

// 新增用户
const handleAddUser = () => {
  editingUser.value = null
  formData.username = ''
  formData.password = ''
  formData.nickname = ''
  formData.email = ''
  formData.avatar = ''
  formData.phone = ''
  formData.gender = 'unknown'
  formData.role = 'user'
  formData.status = 'active'
  dialogVisible.value = true
}

// 编辑用户
const handleEditUser = (user: User) => {
  editingUser.value = user
  formData.username = user.username
  formData.password = ''
  formData.nickname = user.nickname || ''
  formData.email = user.email || ''
  formData.avatar = (user as any).avatar || ''
  formData.phone = (user as any).phone || ''
  formData.gender = (user as any).gender || 'unknown'
  formData.role = user.role
  formData.status = user.status
  dialogVisible.value = true
}

// 保存用户
const handleSaveUser = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    saving.value = true
    try {
      if (editingUser.value) {
        // 编辑用户
        const res: any = await request.put(`/admin/users/${editingUser.value._id}`, {
          username: formData.username,
          nickname: formData.nickname,
          email: formData.email,
          avatar: formData.avatar,
          phone: formData.phone,
          gender: formData.gender,
          role: formData.role,
          status: formData.status
        })

        if (res.success) {
          ElMessage.success('用户更新成功')
          dialogVisible.value = false
          loadUsers()
        }
      } else {
        // 创建新用户
        const res: any = await request.post('/admin/users', {
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname,
          email: formData.email,
          avatar: formData.avatar,
          phone: formData.phone,
          gender: formData.gender,
          role: formData.role
        })

        if (res.success) {
          ElMessage.success('用户创建成功')
          dialogVisible.value = false
          loadUsers()
        }
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      saving.value = false
    }
  })
}

// 重置密码
const handleResetPassword = (user: User) => {
  resetPasswordUserId.value = user._id
  resetPasswordForm.value = ''
  resetPasswordDialogVisible.value = true
}

// 确认重置密码
const handleConfirmResetPassword = async () => {
  if (!resetPasswordForm.value) {
    ElMessage.warning('请输入新密码')
    return
  }

  saving.value = true
  try {
    const res: any = await request.post(
      `/admin/users/${resetPasswordUserId.value}/reset-password`,
      {
        password: resetPasswordForm.value
      }
    )

    if (res.success) {
      ElMessage.success('密码重置成功')
      resetPasswordDialogVisible.value = false
      loadUsers()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '重置失败')
  } finally {
    saving.value = false
  }
}

// 删除用户
const handleDeleteUser = (user: User) => {
  ElMessageBox.confirm(
    `确定删除用户 "${user.username}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    saving.value = true
    try {
      const res: any = await request.delete(`/admin/users/${user._id}`)

      if (res.success) {
        ElMessage.success('用户删除成功')
        loadUsers()
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '删除失败')
    } finally {
      saving.value = false
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 重置表单
const resetForm = () => {
  editingUser.value = null
  formData.username = ''
  formData.password = ''
  formData.nickname = ''
  formData.email = ''
  formData.avatar = ''
  formData.phone = ''
  formData.gender = 'unknown'
  formData.role = 'user'
  formData.status = 'active'
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
loadUsers()
</script>

<style scoped>
</style>
