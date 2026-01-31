<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6 py-12">
    <div class="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
      <!-- 左侧英雄区 -->
      <div class="relative p-8 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white overflow-hidden shadow-lg dark:from-blue-900 dark:to-blue-950">
        <div class="brand text-xs font-bold tracking-widest uppercase opacity-90">Giovan Admin</div>
        <h1 class="text-3xl font-bold mt-4 mb-2">欢迎回来 👋</h1>
        <p class="text-sm opacity-90 leading-relaxed">登录管理后台，快速查看留言、监控与运营数据。</p>
        
        <!-- 徽章 -->
        <div class="flex flex-wrap gap-2 mt-5">
          <span class="px-3 py-1.5 text-xs rounded-full bg-white/20">安全登录</span>
          <span class="px-3 py-1.5 text-xs rounded-full bg-white/20">实时监控</span>
          <span class="px-3 py-1.5 text-xs rounded-full bg-white/20">轻量管理</span>
        </div>

        <!-- 装饰光晕 -->
        <div class="absolute w-36 h-36 right-0 bottom-0 -translate-y-10 translate-x-12 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <!-- 右侧登录卡片 -->
      <el-card class="rounded-2xl border border-slate-200 shadow-lg dark:border-slate-700 dark:bg-slate-900/85" shadow="hover">
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="text-xl font-bold text-gray-900 dark:text-white">后台登录</div>
          <el-button
            type="primary"
            link
            @click="handleBackHome"
            class="text-xs"
          >
            <ArrowLeft class="w-4 h-4" />
            返回首页
          </el-button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">请输入管理员账号密码进入后台。</p>
        
        <el-form :model="form" :rules="rules" ref="formRef">
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="w-full" :loading="loading" @click="handleLogin">登录</el-button>
          </el-form-item>
        </el-form>

        <!-- 分割线 -->
        <div class="relative my-6 text-center">
          <div class="absolute inset-x-0 top-1/2 h-px bg-gray-300 dark:bg-gray-700"></div>
          <span class="relative inline-block px-4 bg-white dark:bg-slate-900 text-sm text-gray-500 dark:text-gray-400">微信小程序登录</span>
        </div>

        <!-- 微信登录面板 -->
        <div class="bg-green-50 border border-green-200 rounded-xl p-5 dark:bg-green-950/35 dark:border-green-900/50">
          <div class="flex items-center justify-between gap-3 text-green-900 font-semibold mb-4 dark:text-green-200">
            <span class="text-sm">微信小程序登录</span>
            <span class="text-xs px-2 py-1 rounded-full bg-green-900/10 text-green-900 tracking-wider dark:bg-green-600/20 dark:text-green-200">WECHAT</span>
          </div>
          <div class="bg-green-100 rounded-lg p-6 flex flex-col items-center gap-2.5 text-sm text-green-900 dark:bg-green-600/15 dark:text-green-200">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=weapp-login" alt="小程序二维码" class="w-36 h-36 rounded-lg bg-white p-1.5" />
            <span>扫码/一键登录</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const formRef = ref<FormInstance>()
const form = ref({
  username: 'admin',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await authStore.login(form.value.username, form.value.password)
      ElMessage.success('登录成功')
      const redirect = (route.query.redirect as string) || '/admin'
      router.replace(redirect)
    } catch (error: any) {
      ElMessage.error(error?.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

const handleBackHome = () => {
  router.push('/')
}
</script>