<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">SPONSOR</span>
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight">赞助支持</h1>
        <p class="text-gray-600 dark:text-gray-400">您的每一份支持都是我们前进的动力，让我们共同创造更多可能 ✨。</p>
      </div>

      <div class="qr-codes">
        <div
          v-for="(method, index) in displayMethods"
          :key="method._id || method.name || index"
          class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10 text-center flex-1 relative overflow-hidden hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all"
          :ref="(el) => (qrCardRefs[index] = el as HTMLElement)"
          @mousemove="(event) => handleQrCardMouseMove(event, index)"
          @mouseleave="() => handleQrCardMouseLeave(index)"
        >
          <!-- 鼠标跟随效果 -->
          <div
            v-if="qrCardEffects[index]?.show"
            class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
            :style="{
              left: qrCardEffects[index]?.x - 80 + 'px',
              top: qrCardEffects[index]?.y - 80 + 'px',
            }"
          ></div>
          <div class="qr-icon" v-if="method.icon">
            <img class="w-32px h-32px" :src="method.icon" :alt="method.name" />
          </div>
          <h3>{{ method.name }}</h3>
          <div class="qr-placeholder">
            <img v-if="method.qrCode" :src="method.qrCode" :alt="method.name" />
            <span v-else>暂无二维码</span>
          </div>
          <p class="qr-description">
            {{ method.description || "扫一扫，请我喝杯咖啡" }}
          </p>
        </div>
      </div>

      <!-- 特别赞助提示 -->
      <div
        class="my-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-shadow"
      >
        <div
          class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-full flex items-center justify-center animate-pulse"
        >
          <Heart class="w-6 h-6 text-white" />
        </div>
        <div class="flex-1 text-left">
          <span
            class="inline-block bg-blue-500 dark:bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2"
            >特别赞助</span
          >
          <p class="text-gray-900 dark:text-gray-100 text-base font-semibold">
            婧女士特别赞助 Mac Mini 一台
          </p>
        </div>
      </div>

      <div class="sponsors-table">
        <h2>赞助名单</h2>
        <el-empty
          v-if="!sponsors.length"
          description="暂无赞助记录"
          class="empty-state"
        />
        <table v-else>
          <thead>
            <tr>
              <th>赞助者</th>
              <th>日期</th>
              <th>寄语</th>
              <th>金额</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(sponsor, index) in sponsors"
              :key="sponsor._id || index"
            >
              <td>{{ sponsor.name }}</td>
              <td>{{ formatDate(sponsor.date || sponsor.createdAt) }}</td>
              <td>{{ sponsor.message || "-" }}</td>
              <td>{{ formatAmount(sponsor.amount) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="sponsors.length" class="mt-8">
          <div v-if="loadingSponsors" class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="!hasMoreSponsors" class="no-more-state">
            没有更多了
          </div>
          <div v-else class="load-more-hint">下滑加载更多</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from "vue";
import { Heart, Mail, ExternalLink } from "lucide-vue-next";
import request from "@/api/request";
import wechatIcon from "@/assets/微信.png";
import wechatQr from "@/assets/wx.jpg";
import alipayIcon from "@/assets/支付宝.png";
import alipayQr from "@/assets/zfb.jpg";

type SponsorMethod = {
  _id?: string;
  name: string;
  icon?: string;
  qrCode?: string;
  description?: string;
};

type Sponsor = {
  _id?: string;
  name: string;
  amount: number;
  message?: string;
  date?: string;
  createdAt?: string;
};

const sponsors = ref<Sponsor[]>([]);
const loadingSponsors = ref(false);
const sponsorPage = ref(1);
const sponsorPageSize = 10;
const hasMoreSponsors = ref(true);
const methods = ref<SponsorMethod[]>([]);
const fallbackMethods: SponsorMethod[] = [
  {
    name: "微信支付",
    icon: wechatIcon,
    qrCode: wechatQr,
    description: "扫一扫，请我喝杯咖啡",
  },
  {
    name: "支付宝",
    icon: alipayIcon,
    qrCode: alipayQr,
    description: "扫一扫，请我喝杯咖啡",
  },
];

const displayMethods = computed(() =>
  methods.value.length ? methods.value : fallbackMethods,
);

const qrCardRefs = ref<HTMLElement[]>([]);
const qrCardEffects = reactive<
  Record<number, { x: number; y: number; show: boolean }>
>({});

const handleQrCardMouseMove = (event: MouseEvent, index: number) => {
  const card = qrCardRefs.value[index];
  if (!card) return;

  const rect = card.getBoundingClientRect();
  qrCardEffects[index] = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    show: true,
  };
};

const handleQrCardMouseLeave = (index: number) => {
  if (qrCardEffects[index]) {
    qrCardEffects[index].show = false;
  }
};

const fetchSponsorMethods = async () => {
  const res = await request.get("/sponsor-methods");
  // 响应拦截器已提取response.data，所以res就是{ code, data, message, success }
  methods.value = Array.isArray(res?.data) ? res.data : [];
};

const fetchSponsors = async (reset = false) => {
  if (loadingSponsors.value) return;
  if (!hasMoreSponsors.value && !reset) return;

  loadingSponsors.value = true;
  try {
    const page = reset ? 1 : sponsorPage.value;
    const res = await request.get("/sponsors", {
      params: { page, pageSize: sponsorPageSize },
    });
    // 响应拦截器已提取response.data，所以res就是{ code, data, meta, message, success }
    const data = Array.isArray(res?.data) ? res.data : [];
    const meta = (res as any)?.meta ?? (res as any)?.pagination ?? {};

    if (reset) {
      sponsors.value = data;
    } else {
      sponsors.value = sponsors.value.concat(data);
    }

    const pageCount = Number(meta.pageCount || 0);
    const total = Number(meta.total || 0);
    if (pageCount) {
      hasMoreSponsors.value = page < pageCount;
    } else if (total) {
      hasMoreSponsors.value = sponsors.value.length < total;
    } else {
      hasMoreSponsors.value = data.length >= sponsorPageSize;
    }

    sponsorPage.value = page + 1;
  } finally {
    loadingSponsors.value = false;
  }
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN");
};

const formatAmount = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return `${Number(value).toFixed(2)} 元`;
};

const loadMoreSponsors = () => {
  if (loadingSponsors.value || !hasMoreSponsors.value) return;
  fetchSponsors();
};

const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollHeight - scrollTop - clientHeight < 300) {
    loadMoreSponsors();
  }
};

onMounted(() => {
  fetchSponsorMethods();
  fetchSponsors(true);
  window.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.qr-codes {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin: 32px 0;
}

@media (max-width: 768px) {
  .qr-codes {
    flex-direction: column;
    align-items: center;
  }
}

.qr-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(209, 213, 219, 0.6);
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  flex: 1;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.dark .qr-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.qr-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border-color: rgba(59, 130, 246, 0.7);
  transform: translateY(-2px);
}

.dark .qr-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

.qr-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.qr-icon .lucide-heart {
  color: #ff6b6b;
}

.qr-card h3 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 24px 0;
}

.qr-placeholder {
  width: 160px;
  height: 160px;
  background: #f9fafb;
  border-radius: 8px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
}

.qr-placeholder img {
  width: 140px;
  height: 140px;
  border-radius: 8px;
}

.qr-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.afdian-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  color: #374151;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
}

.afdian-link:hover {
  background: #f3f4f6;
}

.notice {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  margin-top: 24px;
  text-align: center;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notice-text {
  color: #1e40af;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
  flex: 1;
  text-align: left;
}

.notice-text strong {
  color: #dc2626;
  font-weight: 600;
}

.email {
  color: #2563eb;
  text-decoration: none;
  font-size: 14px;
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 4px;
  font-family: monospace;
}

.email:hover {
  background: #e2e8f0;
}

.sponsors-table h2 {
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.sponsors-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.sponsors-table th,
.sponsors-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.sponsors-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.025em;
}

.sponsors-table td {
  color: #6b7280;
  font-size: 14px;
}

.sponsors-table tbody tr:hover {
  background: #f9fafb;
}

.sponsors-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-state {
  padding: 24px 0 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.load-more-hint {
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
  font-size: 14px;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.no-more-state {
  text-align: center;
  padding: 32px 16px;
  color: #d1d5db;
  font-size: 14px;
}

@media (max-width: 768px) {
  .title {
    font-size: 28px;
  }

  .qr-codes {
    flex-direction: column;
    align-items: center;
  }

  .sponsors-table {
    overflow-x: auto;
  }

  .sponsors-table table {
    min-width: 500px;
  }

  .qr-card {
    padding: 24px 20px;
  }

  .qr-card img {
    width: 160px;
    height: 160px;
  }
  .qr-icon img {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .notice {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
}
</style>
