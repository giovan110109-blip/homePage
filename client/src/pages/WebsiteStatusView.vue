<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">WEBSITE STATUS</span>
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight">网站监控</h1>
        <p class="text-gray-600 dark:text-gray-400">实时监控我的网站和项目状态，展示在线情况和响应速度 🌐。</p>
      </div>

      <!-- Websites Status List -->
      <div class="mt-12 sm:mt-16">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200/80 dark:border-white/10">
          在线状态
        </h2>

        <div v-if="websites.length === 0" class="text-center py-10 px-5 text-gray-400 dark:text-gray-500 text-base">
          <p>暂无网站监控记录</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <div
            v-for="(website, index) in websites"
            :key="index"
            class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10  hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all flex flex-col"
          >
            <!-- Status Indicator -->
            <div class="flex items-center justify-between mb-4">
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                :class="getStatusBadgeClass(website.status)"
              >
                <div class="h-2 w-2 rounded-full bg-current"></div>
                <span>{{ getStatusText(website.status) }}</span>
              </div>
            </div>

            <!-- Website Info -->
            <div class="mb-5 flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {{ website.name }}
              </h3>
              <p v-if="website.description" class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {{ website.description }}
              </p>
              <a
                :href="website.url"
                target="_blank"
                class="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {{ website.url }}
                <ExternalLink class="w-3 h-3" />
              </a>
            </div>

            <!-- Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
              <div class="flex flex-col items-center text-center">
                <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">响应时间</span>
                <span
                  class="text-base font-semibold text-gray-900 dark:text-white"
                  :class="getLatencyClass(website.latency)"
                >
                  {{
                    website.latency !== null
                      ? website.latency + "ms"
                      : "检测中..."
                  }}
                </span>
              </div>

              <div class="flex flex-col items-center text-center">
                <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">检查时间</span>
                <span class="text-base font-semibold text-gray-900 dark:text-white">{{
                  formatCheckTime(website.lastCheck)
                }}</span>
              </div>

              <div class="flex flex-col items-center text-center">
                <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">正常率</span>
                <span class="text-base font-semibold text-gray-900 dark:text-white"
                  >{{ formatUptime(website.uptime) }}%</span
                >
              </div>
            </div>

            <!-- Status Details -->
            <div class="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 mb-4 text-sm">
              <!-- <div v-if="website.statusCode" class="detail-item">
                    <span class="detail-label">HTTP 状态码：</span>
                    <span
                      class="detail-value"
                      :class="getStatusCodeClass(website.statusCode)"
                    >
                      {{ website.statusCode }}
                    </span>
                  </div>
                  <div v-if="website.message" class="detail-item">
                    <span class="detail-label">信息：</span>
                    <span class="detail-value">{{ formatMessage(website.message) }}</span>
                  </div> -->
              <div v-if="website.ssl" class="flex items-center justify-between gap-3">
                <span class="text-gray-500 dark:text-gray-400 font-medium">证书状态：</span>
                <span
                  class="text-gray-900 dark:text-gray-200 font-mono font-medium"
                  :class="getCertStatusClass(website.ssl.status)"
                >
                  {{ getCertStatusText(website.ssl.status) }}
                </span>
              </div>
              <div v-if="website.ssl?.validTo" class="flex items-center justify-between gap-3">
                <span class="text-gray-500 dark:text-gray-400 font-medium">证书到期：</span>
                <span class="text-gray-900 dark:text-gray-200 font-mono font-medium">
                  {{ formatDate(website.ssl.validTo) }}
                  <span v-if="website.ssl?.daysRemaining !== null"
                    >（剩余 {{ website.ssl.daysRemaining }} 天）</span
                  >
                </span>
              </div>
            </div>

            <!-- Check Button -->
            <AppButton
              variant="check"
              nativeType="button"
              :disabled="website.checking"
              @click="checkWebsite(index)"
            >
              <RotateCw
                class="w-4 h-4"
                :class="{ 'animate-spin': website.checking }"
              />
              {{ website.checking ? "检测中..." : "立即检测" }}
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div v-if="websites.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5">监控网站</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ websites.length }}</span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5">在线</span>
          <span class="text-2xl font-bold text-emerald-500">{{ onlineCount }}</span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5">离线</span>
          <span class="text-2xl font-bold text-rose-500">{{ offlineCount }}</span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5">平均延迟</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ averageLatency }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ExternalLink, RotateCw } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import request from "@/api/request";

interface Website {
  name: string;
  url: string;
  description?: string;
  status: "online" | "offline" | "checking";
  latency: number | null;
  statusCode: number | null;
  message: string;
  lastCheck: Date | null;
  uptime: number;
  checking: boolean;
  ssl?: {
    status: "valid" | "expiring" | "expired" | "none" | "error";
    validFrom?: string | null;
    validTo?: string | null;
    daysRemaining?: number | null;
    issuer?: string | null;
    subject?: string | null;
    serialNumber?: string | null;
    fingerprint?: string | null;
    error?: string;
  };
}

const newWebsite = ref({
  name: "",
  url: "",
  description: "",
});

const websites = ref<Website[]>([
  {
    name: "个人主页",
    url: "https://www.giovan.cn",
    description: "我的个人主页",
    status: "online",
    latency: 0,
    statusCode: 0,
    message: null,
    lastCheck: new Date(Date.now() - 5 * 60 * 1000),
    uptime: 0,
    checking: false,
    ssl: {
      status: "valid",
      validTo: null,
      daysRemaining: null,
    },
  },
  {
    name: "服务",
    url: "https://serve.giovan.cn",
    description: "后端服务",
    status: "online",
    latency: 0,
    statusCode: 0,
    message: null,
    lastCheck: new Date(Date.now() - 5 * 60 * 1000),
    uptime: 0,
    checking: false,
    ssl: {
      status: "valid",
      validTo: null,
      daysRemaining: null,
    },
  },
  {
    name: "UptimeKuma",
    url: "https://monitor.giovan.cn",
    description: "UptimeKuma",
    status: "online",
    latency: 0,
    statusCode: 0,
    message: null,
    lastCheck: new Date(Date.now() - 5 * 60 * 1000),
    uptime: 0,
    checking: false,
    ssl: {
      status: "valid",
      validTo: null,
      daysRemaining: null,
    },
  },
  {
    name: "webDav",
    url: "https://file.giovan.cn",
    description: "webDav",
    status: "online",
    latency: 0,
    statusCode: 0,
    message: null,
    lastCheck: new Date(Date.now() - 5 * 60 * 1000),
    uptime: 0,
    checking: false,
    ssl: {
      status: "valid",
      validTo: null,
      daysRemaining: null,
    },
  },
]);

const onlineCount = computed(
  () => websites.value.filter((w) => w.status === "online").length,
);
const offlineCount = computed(
  () => websites.value.filter((w) => w.status === "offline").length,
);
const averageLatency = computed(() => {
  const latencies = websites.value
    .filter((w) => w.latency !== null)
    .map((w) => w.latency as number);

  if (latencies.length === 0) return 0;
  return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
});

const addWebsite = () => {
  if (!newWebsite.value.name || !newWebsite.value.url) {
    alert("请填写网站名称和URL");
    return;
  }

  websites.value.push({
    name: newWebsite.value.name,
    url: newWebsite.value.url,
    description: newWebsite.value.description || undefined,
    status: "checking",
    latency: null,
    statusCode: null,
    message: "初始化中...",
    lastCheck: null,
    uptime: 100,
    checking: true,
  });

  const index = websites.value.length - 1;

  // 模拟检测
  setTimeout(() => {
    checkWebsite(index);
  }, 500);

  newWebsite.value = {
    name: "",
    url: "",
    description: "",
  };
};

const checkWebsite = async (index: number) => {
  const website = websites.value[index];
  website.checking = true;
  website.status = "checking";

  try {
    const res = await request.get("/monitor/check", {
      params: { url: website.url },
    });

    const data = res?.data || res;

    website.status = data.status === "online" ? "online" : "offline";
    website.latency = typeof data.latency === "number" ? data.latency : null;
    website.statusCode = data.statusCode ?? null;
    website.message = data.message || "连接成功";
    website.ssl = data.ssl || { status: "none" };
    website.lastCheck = data.checkedAt ? new Date(data.checkedAt) : new Date();
  } catch (error: any) {
    website.status = "offline";
    website.latency = null;
    website.statusCode = null;
    website.message = error?.message || "连接失败";
    website.ssl = { status: "error", error: error?.message || "检测失败" };
    website.lastCheck = new Date();
  } finally {
    website.checking = false;
    website.uptime = Math.max(85, 100 - Math.random() * 15);
  }
};

onMounted(() => {
  websites.value.forEach((_, index) => {
    checkWebsite(index);
  });
});

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    online: "在线",
    offline: "离线",
    checking: "检测中",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    online:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    offline:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    checking:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return (
    map[status] ||
    "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
  );
};

const getLatencyClass = (latency: number | null) => {
  if (latency === null) return "text-gray-400 dark:text-gray-500";
  if (latency < 100) return "text-emerald-500";
  if (latency < 300) return "text-amber-500";
  return "text-rose-500";
};

const getStatusCodeClass = (code: number) => {
  if (code >= 200 && code < 300) return "text-emerald-500";
  if (code >= 300 && code < 400) return "text-blue-500";
  if (code >= 400 && code < 500) return "text-amber-500";
  if (code >= 500) return "text-rose-500";
  return "text-gray-400 dark:text-gray-500";
};

const getCertStatusText = (status: string) => {
  const map: Record<string, string> = {
    valid: "有效",
    expiring: "即将到期",
    expired: "已过期",
    none: "无证书",
    error: "检测失败",
  };
  return map[status] || status;
};

const getCertStatusClass = (status: string) => {
  if (status === "valid") return "text-emerald-500";
  if (status === "expiring") return "text-blue-500";
  if (status === "expired") return "text-amber-500";
  if (status === "error") return "text-rose-500";
  return "text-gray-400 dark:text-gray-500";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatUptime = (value: number) => {
  if (Number.isNaN(value)) return "0.0";
  return value.toFixed(1);
};

const formatMessage = (value: string) => {
  if (!value) return "-";
  if (value.length <= 32) return value;
  return `${value.slice(0, 28)}...`;
};

const formatCheckTime = (date: Date | null) => {
  if (!date) return "未检测";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};
</script>
