<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-12"
  >
    <div
      class="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch"
    >
      <!-- 左侧英雄区 -->
      <div
        class="relative p-8 rounded-2xl bg-blue-600 text-white overflow-hidden shadow-lg dark:bg-blue-900 lg:bg-gradient-to-br lg:from-blue-500 lg:to-blue-700 lg:dark:from-blue-900 lg:dark:to-blue-950"
      >
        <div
          class="brand text-xs font-bold tracking-widest uppercase opacity-90"
        >
          Giovan Admin
        </div>
        <h1 class="text-3xl font-bold mt-4 mb-2">欢迎回来 👋</h1>
        <p class="text-sm opacity-90 leading-relaxed">
          登录管理后台，快速查看留言、监控与运营数据。
        </p>

        <!-- 徽章 -->
        <div class="flex flex-wrap gap-2 mt-5">
          <span class="px-3 py-1.5 text-xs rounded-full bg-white/20"
            >安全登录</span
          >
          <span class="px-3 py-1.5 text-xs rounded-full bg-white/20"
            >实时监控</span
          >
          <span class="px-3 py-1.5 text-xs rounded-full bg-white/20"
            >轻量管理</span
          >
        </div>

        <!-- 装饰光晕 - 仅桌面端显示 -->
        <div
          class="hidden lg:block absolute w-36 h-36 right-0 bottom-0 -translate-y-10 translate-x-12 bg-white/10 rounded-full blur-2xl"
        ></div>
      </div>

      <!-- 右侧登录卡片 -->
      <el-card
        class="rounded-2xl border border-slate-200 shadow-lg dark:border-slate-700 bg-white dark:bg-slate-900 lg:bg-gradient-to-br lg:from-white/90 lg:via-white/80 lg:to-blue-50/70 lg:dark:from-slate-900/90 lg:dark:via-slate-900/85 lg:dark:to-blue-950/60"
        shadow="hover"
      >
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="text-xl font-bold text-gray-900 dark:text-white">
            后台登录
          </div>
          <AppButton
            variant="link-primary"
            size="none"
            @click="handleBackHome"
            class="text-xs"
          >
            <ArrowLeft class="w-4 h-4" />
            返回首页
          </AppButton>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          请输入管理员账号密码进入后台。
        </p>

        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>
          <el-form-item>
            <AppButton
              variant="primary"
              nativeType="submit"
              class="w-full"
              :disabled="loading"
            >
              登录
            </AppButton>
          </el-form-item>
        </el-form>

        <!-- 分割线 -->
        <div class="relative my-6 text-center">
          <div
            class="absolute inset-x-0 top-1/2 h-px bg-gray-300 dark:bg-gray-700"
          ></div>
          <span
            class="relative inline-block px-4 bg-white dark:bg-slate-900 text-sm text-gray-500 dark:text-gray-400"
            >微信小程序登录</span
          >
        </div>

        <!-- 微信登录面板 -->
        <div
          class="bg-green-50 border border-green-200 rounded-xl p-5 dark:bg-green-950/35 dark:border-green-900/50"
        >
          <div
            class="flex items-center justify-between gap-3 text-green-900 font-semibold mb-4 dark:text-green-200"
          >
            <span class="text-sm">微信小程序登录</span>
            <span
              class="text-xs px-2 py-1 rounded-full bg-green-900/10 text-green-900 tracking-wider dark:bg-green-600/20 dark:text-green-200"
              >WECHAT</span
            >
          </div>

          <!-- 懒加载：点击后才显示二维码 -->
          <div
            class="bg-green-100 rounded-lg p-6 flex flex-col items-center gap-2.5 text-sm text-green-900 dark:bg-green-600/15 dark:text-green-200 min-h-[220px]"
          >
            <div
              class="relative w-36 h-36 rounded-lg bg-white p-1.5 flex items-center justify-center"
            >
              <!-- 未点击时显示按钮 -->
              <div
                v-if="!showQrCode"
                class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white rounded-lg"
              >
                <AppButton
                  variant="outline"
                  size="sm"
                  @click="handleShowQrCode"
                >
                  <QrCode class="w-4 h-4 mr-2" />
                  显示二维码
                </AppButton>
              </div>

              <!-- 加载中 -->
              <div
                v-else-if="loadingQr"
                class="flex flex-col items-center gap-2 text-gray-400"
              >
                <RefreshCw class="w-8 h-8 animate-spin" />
                <span class="text-xs">加载中...</span>
              </div>

              <!-- 二维码过期遮罩 -->
              <div
                v-else-if="qrExpired"
                class="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-2 rounded-lg"
              >
                <span class="text-xs text-gray-500">二维码已过期</span>
                <AppButton variant="primary" size="sm" @click="initQrLogin">
                  刷新
                </AppButton>
              </div>
            </div>
            <span class="text-center">{{
              qrStatus === "scanned"
                ? "已扫码，请在手机上确认"
                : showQrCode
                  ? "扫码/一键登录"
                  : "点击上方按钮显示二维码"
            }}</span>
          </div>
        </div>
      </el-card>
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
import { createQrSession, getQrCodeUrl, checkQrStatus } from "@/api/auth";

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
let pollTimer: ReturnType<typeof setInterval> | null = null;

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

const initQrLogin = async () => {
  try {
    qrExpired.value = false;
    qrStatus.value = "pending";
    loadingQr.value = true;

    const res = await createQrSession();
    qrToken.value = res.data.qrToken;
    qrCodeUrl.value = getQrCodeUrl(qrToken.value);

    loadingQr.value = false;
    startPolling();
  } catch (error) {
    console.error("initQrLogin error:", error);
    loadingQr.value = false;
    ElMessage.error("初始化二维码失败");
  }
};

const startPolling = () => {
  stopPolling();

  let pollCount = 0;
  const maxPolls = 45; // 最多轮询45次 (约7.5分钟，10秒一次)

  pollTimer = setInterval(async () => {
    if (!qrToken.value) return;

    pollCount++;
    if (pollCount > maxPolls) {
      qrExpired.value = true;
      stopPolling();
      return;
    }

    try {
      const res = await checkQrStatus(qrToken.value);
      qrStatus.value = res.data.status;

      if (res.data.status === "confirmed" && res.data.token) {
        stopPolling();
        authStore.token = res.data.token;
        authStore.user = res.data.user || null;
        ElMessage.success("登录成功");
        const redirect = (route.query.redirect as string) || "/admin";
        router.replace(redirect);
      }
    } catch {
      qrExpired.value = true;
      stopPolling();
    }
  }, 10000); // 10秒轮询一次
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

onUnmounted(() => {
  stopPolling();
});
</script>
