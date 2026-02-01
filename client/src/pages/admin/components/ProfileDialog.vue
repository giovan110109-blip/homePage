<template>
  <el-dialog
    v-model="visible"
    title="个人信息"
    width="90%"
    :style="{ maxWidth: '700px' }"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :label-position="isMobile ? 'top' : 'right'"
      class="profile-form"
    >
      <!-- 头像 -->
      <el-form-item label="头像">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div class="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity group border-2 border-indigo-300/50 dark:border-slate-600">
            <img v-if="form.avatar" :src="form.avatar" class="w-full h-full object-cover" />
            <User v-else class="w-10 h-10 text-white" />
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
            <span class="text-xs text-slate-500">建议尺寸：200x200</span>
            <AppButton v-if="form.avatar" variant="ghost-danger" size="xs" @click="form.avatar = ''">
              删除头像
            </AppButton>
          </div>
        </div>
      </el-form-item>

      <!-- 用户名 -->
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" disabled placeholder="系统账号，不可修改" />
      </el-form-item>

      <!-- 昵称 -->
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="20" show-word-limit />
      </el-form-item>

      <!-- 真实姓名 -->
      <el-form-item label="真实姓名">
        <el-input v-model="form.realName" placeholder="请输入真实姓名" maxlength="20" />
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>

      <!-- 手机号 -->
      <el-form-item label="手机号">
        <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
      </el-form-item>

      <!-- 性别 -->
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="male">男</el-radio>
          <el-radio value="female">女</el-radio>
          <el-radio value="unknown">保密</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 生日 -->
      <el-form-item label="生日">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          placeholder="请选择生日"
          value-format="YYYY-MM-DD"
          class="w-full"
        />
      </el-form-item>

      <!-- 所在地 -->
      <el-form-item label="所在地">
        <el-input v-model="form.location" placeholder="例如：北京市" maxlength="50" />
      </el-form-item>

      <!-- 修改密码 -->
      <el-divider content-position="left">
        <span class="text-sm text-slate-600 dark:text-slate-400">修改密码</span>
      </el-divider>

      <el-form-item label="原密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="不修改密码请留空"
          show-password
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="不修改密码请留空"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="不修改密码请留空"
          show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="reset" size="sm" @click="handleClose">取消</AppButton>
        <AppButton variant="primary" size="sm" :loading="saving" @click="handleSave">
          保存
        </AppButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import AppButton from '@/components/ui/AppButton.vue'
import { User } from 'lucide-vue-next'
import request from '@/api/request'
import {  getAssetURL } from '@/utils'
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'updated': []
}>()

// 检测移动端
const isMobile = computed(() => {
  return window.innerWidth < 640
})

const visible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

interface ProfileForm {
  username: string
  nickname: string
  realName: string
  avatar: string
  email: string
  phone: string
  gender: 'unknown' | 'male' | 'female'
  birthday: string
  location: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const form = reactive<ProfileForm>({
  username: '',
  nickname: '',
  realName: '',
  avatar: '',
  email: '',
  phone: '',
  gender: 'unknown',
  birthday: '',
  location: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证规则
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value && value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules<ProfileForm>>({
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  newPassword: [
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

// 监听外部 v-model
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    loadProfile()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 加载个人信息
const loadProfile = async () => {
  try {
    const res: any = await request.get('/admin/profile')
    if (res.success) {
      Object.assign(form, {
        username: res.data.username || '',
        nickname: res.data.nickname || '',
        realName: res.data.realName || '',
        avatar: res.data.avatar || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        gender: res.data.gender || 'unknown',
        birthday: res.data.birthday || '',
        location: res.data.location || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  }
}

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  const data = response?.data || response
  if (data?.url) {
    let url = getAssetURL(data.url)
    form.avatar = url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response?.message || '上传失败')
  }
}

// 头像上传前验证
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

// 文件上传处理
const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件
  if (!beforeAvatarUpload(file)) {
    return
  }

  // 创建FormData
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res: any = await request.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    handleAvatarSuccess(res)
    // 重置input
    input.value = ''
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  }
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 检查密码逻辑
    if (form.newPassword && !form.oldPassword) {
      ElMessage.warning('请输入原密码')
      return
    }

    try {
      saving.value = true

      const data: any = {
        nickname: form.nickname,
        realName: form.realName,
        avatar: form.avatar,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        birthday: form.birthday,
        location: form.location
      }

      // 如果要修改密码
      if (form.oldPassword && form.newPassword) {
        data.oldPassword = form.oldPassword
        data.newPassword = form.newPassword
      }

      const res: any = await request.put('/admin/profile', data)

      if (res.success) {
        ElMessage.success('保存成功')
        emit('updated')
        handleClose()
      }
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

// 关闭
const handleClose = () => {
  formRef.value?.resetFields()
  visible.value = false
}
</script>

<style scoped>
.profile-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.profile-form :deep(.el-form-item__content) {
  display: flex;
  align-items: flex-start;
}
</style>
