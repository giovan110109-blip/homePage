<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8 relative overflow-hidden"
  >
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"></div>
    </div>

    <div
      class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0 items-stretch relative z-10"
    >
      <!-- 左侧英雄区 -->
      <div
        class="relative p-8 lg:p-12 rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden shadow-2xl shadow-blue-500/20"
      >
        <!-- 背景网格 -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 40px 40px;"></div>
        </div>

        <!-- 装饰圆 -->
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl"></div>

        <div class="relative z-10">
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium tracking-wider uppercase"
          >
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Giovan Admin
          </div>

          <h1 class="text-4xl lg:text-5xl font-bold mt-6 mb-4 leading-tight">
            欢迎回来
            <span class="inline-block ml-2">👋</span>
          </h1>
          
          <p class="text-lg text-blue-100 leading-relaxed max-w-sm">
            登录管理后台，快速查看留言、监控与运营数据。
          </p>

          <!-- 功能卡片 -->
          <div class="mt-10 space-y-3">
            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <div class="font-medium">安全登录</div>
                <div class="text-sm text-blue-200">多重验证保护</div>
              </div>
            </div>

            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <div class="font-medium">实时监控</div>
                <div class="text-sm text-blue-200">数据可视化</div>
              </div>
            </div>

            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <div class="font-medium">轻量管理</div>
                <div class="text-sm text-blue-200">快速响应</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录卡片 -->
      <div
        class="bg-white dark:bg-slate-900 rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 lg:p-12"
      >
        <div class="max-w-md mx-auto">
          <!-- 头部 -->
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">后台登录</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">请输入管理员账号密码</p>
            </div>
            <AppButton
              variant="link-primary"
              size="none"
              @click="handleBackHome"
              class="text-sm flex items-center gap-1"
            >
              <ArrowLeft class="w-4 h-4" />
              返回首页
            </AppButton>
          </div>

          <!-- 登录表单 -->
          <el-form
            :model="form"
            :rules="rules"
            ref="formRef"
            @submit.prevent="handleLogin"
            class="space-y-5"
          >
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">账号</label>
              <el-form-item prop="username" class="mb-0">
                <el-input
                  v-model="form.username"
                  placeholder="请输入账号"
                  size="large"
                />
              </el-form-item>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">密码</label>
              <el-form-item prop="password" class="mb-0">
                <el-input
                  v-model="form.password"
                  type="password"
                  show-password
                  placeholder="请输入密码"
                  size="large"
                />
              </el-form-item>
            </div>

            <el-form-item class="mb-0 mt-6">
              <AppButton
                variant="primary"
                nativeType="submit"
                class="w-full h-12 text-base font-medium rounded-xl"
                :disabled="loading"
              >
                {{ loading ? '登录中...' : '登录' }}
              </AppButton>
            </el-form-item>
          </el-form>

          <!-- 分割线 -->
          <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">或使用微信登录</span>
            </div>
          </div>

          <!-- 微信登录面板 -->
          <div
            class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded-2xl p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                </div>
                <span class="font-semibold text-green-800 dark:text-green-200">微信小程序登录</span>
              </div>
              <span class="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 font-medium">WECHAT</span>
            </div>

            <!-- 二维码区域 -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center min-h-[200px]"
            >
              <div
                class="relative w-36 h-36 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center"
              >
                <!-- 未点击时显示按钮 -->
                <button
                  v-if="!showQrCode"
                  @click="handleShowQrCode"
                  class="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <QrCode class="w-10 h-10 text-green-500" />
                  <span class="text-sm text-gray-600 dark:text-gray-300">显示二维码</span>
                </button>

                <!-- 加载中 -->
                <div
                  v-else-if="loadingQr"
                  class="flex flex-col items-center gap-2 text-gray-400"
                >
                  <RefreshCw class="w-8 h-8 animate-spin" />
                  <span class="text-xs">加载中...</span>
                </div>

                <!-- 已扫码 - 显示用户信息 -->
                <div
                  v-else-if="qrStatus === 'scanned' && scannedUserInfo"
                  class="absolute inset-0 bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-2 rounded-xl"
                >
                  <img
                    v-if="scannedUserInfo.avatar"
                    :src="scannedUserInfo.avatar"
                    alt="用户头像"
                    class="w-14 h-14 rounded-full object-cover ring-2 ring-green-500 ring-offset-2"
                  />
                  <div
                    v-else
                    class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 text-xl font-bold"
                  >
                    {{ scannedUserInfo.nickname?.charAt(0) || 'U' }}
                  </div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ scannedUserInfo.nickname || '用户' }}</span>
                  <span class="text-xs text-green-600 dark:text-green-400">请在手机上确认登录</span>
                </div>

                <!-- 二维码图片 -->
                <img
                  v-else-if="qrCodeUrl && !qrExpired"
                  :src="qrCodeUrl"
                  alt="微信小程序二维码"
                  class="w-full h-full object-contain rounded-lg"
                  @error="handleQrImageError"
                />

                <!-- 二维码过期遮罩 -->
                <div
                  v-else-if="qrExpired"
                  class="absolute inset-0 bg-white/95 dark:bg-slate-800/95 flex flex-col items-center justify-center gap-3 rounded-xl"
                >
                  <span class="text-sm text-gray-500 dark:text-gray-400">二维码已过期</span>
                  <AppButton variant="primary" size="sm" @click="initQrLogin">
                    刷新
                  </AppButton>
                </div>
              </div>
              
              <!-- 状态提示 -->
              <div class="mt-4 text-center">
                <p v-if="qrStatus === 'scanned' && scannedUserInfo" class="text-green-600 dark:text-green-400 font-medium text-sm">
                  已扫码，等待确认...
                </p>
                <p v-else-if="showQrCode && !qrExpired" class="text-sm text-gray-600 dark:text-gray-300">
                  使用微信扫码登录
                  <span v-if="countdown > 0" class="block text-xs text-gray-400 mt-1">
                    {{ Math.floor(countdown / 60) }}:{{ String(countdown % 60).padStart(2, '0') }} 后过期
                  </span>
                </p>
                <p v-else-if="!showQrCode" class="text-sm text-gray-500 dark:text-gray-400">点击上方按钮显示二维码</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { ArrowLeft, RefreshCw, QrCode } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import { useAuthStore } from "@/stores/auth";
import { createQrSession, getQrCodeUrl, checkQrStatus, type QrStatusData } from "@/api/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const formRef = ref<FormInstance>();
const form = ref({
  username: "",
  password: "",
});

const rules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const showQrCode = ref(false);
const loadingQr = ref(false);
const qrToken = ref("");
const qrCodeUrl = ref("");
const qrStatus = ref<"pending" | "scanned" | "confirmed">("pending");
const qrExpired = ref(false);
const scannedUserInfo = ref<QrStatusData["userInfo"]>(null);
const countdown = ref(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await authStore.login(form.value.username, form.value.password);
      ElMessage.success("登录成功");
      const redirect = (route.query.redirect as string) || "/admin";
      router.replace(redirect);
    } catch (error: any) {
      ElMessage.error(error?.message || "登录失败");
    } finally {
      loading.value = false;
    }
  });
};

const handleBackHome = () => {
  router.push("/");
};

const handleShowQrCode = async () => {
  showQrCode.value = true;
  await initQrLogin();
};

const handleQrImageError = () => {
  ElMessage.error("二维码加载失败，请重试");
  qrExpired.value = true;
};

const initQrLogin = async () => {
  try {
    qrExpired.value = false;
    qrStatus.value = "pending";
    scannedUserInfo.value = null;
    loadingQr.value = true;

    const res = await createQrSession();
    qrToken.value = res.data.qrToken;
    qrCodeUrl.value = getQrCodeUrl(qrToken.value);

    loadingQr.value = false;
    startCountdown();
    startPolling();
  } catch (error) {
    loadingQr.value = false;
    ElMessage.error("初始化二维码失败");
  }
};

const startCountdown = () => {
  stopCountdown();
  countdown.value = 300;

  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      stopCountdown();
      qrExpired.value = true;
      stopPolling();
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const startPolling = () => {
  stopPolling();

  pollTimer = setInterval(async () => {
    if (!qrToken.value) return;

    try {
      const res = await checkQrStatus(qrToken.value);
      qrStatus.value = res.data.status;

      if (res.data.status === "scanned" && res.data.userInfo) {
        scannedUserInfo.value = res.data.userInfo;
      }

      if (res.data.status === "confirmed" && res.data.token) {
        stopPolling();
        stopCountdown();
        authStore.token = res.data.token;
        authStore.user = res.data.user || null;
        ElMessage.success("登录成功");
        const redirect = (route.query.redirect as string) || "/admin";
        router.replace(redirect);
      }
    } catch (error: any) {
      const status = error?.response?.status || error?.status;
      if (status === 404 || error?.message?.includes('过期')) {
        qrExpired.value = true;
        stopPolling();
        stopCountdown();
      }
    }
  }, 3000);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

onUnmounted(() => {
  stopPolling();
  stopCountdown();
});
</script>

<style scoped>
.el-form {
  width: 100%;
}

.el-form-item {
  margin-bottom: 0;
  width: 100%;
}

.el-form-item :deep(.el-form-item__content) {
  width: 100%;
}

.el-form-item :deep(.el-input) {
  width: 100%;
}

.el-form-item :deep(.el-input__wrapper) {
  border-radius: 12px !important;
  box-shadow: 0 0 0 1px #e5e7eb !important;
  transition: all 0.2s;
  padding: 4px 16px;
}

.el-form-item :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3b82f6 !important;
}

.el-form-item :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6 !important;
}

.dark .el-form-item :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #374151 !important;
}

.dark .el-form-item :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #60a5fa !important;
}

.dark .el-form-item :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #60a5fa !important;
}
</style>
