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

      <div class="flex flex-col md:flex-row md:justify-between items-center gap-6 my-8">
        <div
          v-for="(method, index) in displayMethods"
          :key="method._id || method.name || index"
          class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl px-5 py-6 md:p-8 border border-gray-200/60 dark:border-white/10 text-center flex-1 relative overflow-hidden shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300"
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
          <div class="flex items-center justify-center mb-4" v-if="method.icon">
            <img class="w-8 h-8" :src="method.icon" :alt="method.name" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mt-4 mb-6">{{ method.name }}</h3>
          <div class="w-40 h-40 bg-gray-50 rounded-lg mx-auto mb-5 flex items-center justify-center border border-gray-200">
            <img
              v-if="method.qrCode"
              :src="method.qrCode"
              :alt="method.name"
              class="w-40 h-40 md:w-[140px] md:h-[140px] rounded-lg"
            />
            <span v-else class="text-sm text-gray-400">暂无二维码</span>
          </div>
          <p class="text-sm text-gray-500 mb-4">
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

      <div class="mt-12">
        <h2 class="text-2xl font-semibold text-gray-900 text-center mb-6">赞助名单</h2>
        <el-empty
          v-if="!sponsors.length"
          description="暂无赞助记录"
          class="pt-6 pb-3"
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[500px] md:min-w-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-4 text-left border-b border-gray-100 text-gray-700 font-semibold text-sm tracking-wide">赞助者</th>
                <th class="px-4 py-4 text-left border-b border-gray-100 text-gray-700 font-semibold text-sm tracking-wide">日期</th>
                <th class="px-4 py-4 text-left border-b border-gray-100 text-gray-700 font-semibold text-sm tracking-wide">寄语</th>
                <th class="px-4 py-4 text-left border-b border-gray-100 text-gray-700 font-semibold text-sm tracking-wide">金额</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(sponsor, index) in sponsors"
                :key="sponsor._id || index"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-4 text-left border-b border-gray-100 text-gray-500 text-sm last:border-b-0">{{ sponsor.name }}</td>
                <td class="px-4 py-4 text-left border-b border-gray-100 text-gray-500 text-sm last:border-b-0">{{ formatDate(sponsor.date || sponsor.createdAt) }}</td>
                <td class="px-4 py-4 text-left border-b border-gray-100 text-gray-500 text-sm last:border-b-0">{{ sponsor.message || "-" }}</td>
                <td class="px-4 py-4 text-left border-b border-gray-100 text-gray-500 text-sm last:border-b-0">{{ formatAmount(sponsor.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="sponsors.length" class="mt-8">
          <div v-if="loadingSponsors" class="flex flex-col items-center justify-center py-12 text-gray-500">
            <div class="w-8 h-8 border-[3px] border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="!hasMoreSponsors" class="text-center py-8 text-gray-300 text-sm">
            没有更多了
          </div>
          <div v-else class="text-center py-8 text-gray-400 text-sm animate-fade-in-out">下滑加载更多</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from "vue";
import { Heart } from "lucide-vue-next";
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
