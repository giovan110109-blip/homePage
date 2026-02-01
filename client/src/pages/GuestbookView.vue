<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">GUESTBOOK</span>
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight">留言板</h1>
        <p class="text-gray-600 dark:text-gray-400">在这里留下你的想法和建议，我会认真阅读每一条留言 💬。</p>
      </div>

      <!-- Message Form -->
      <div class="max-w-2xl mx-auto">
        <div
          class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-200/60 dark:border-white/10 shadow-2xl mb-8"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            发表留言
          </h2>
          <form @submit.prevent="submitMessage" class="space-y-6">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                昵称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入你的昵称"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                邮箱 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.email"
                type="email"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入你的邮箱"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站 (可选)
              </label>
              <input
                v-model="formData.website"
                type="text"
                inputmode="url"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="例如：example.com 或 https://example.com"
                autocomplete="url"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                留言内容 <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="formData.message"
                required
                rows="5"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="请输入你的留言..."
              ></textarea>
            </div>

            <div class="flex items-center justify-end space-x-4">
              <AppButton
                variant="primary"
                nativeType="submit"
                :disabled="submitting"
              >
                {{ submitting ? "提交中..." : "提交留言" }}
              </AppButton>
            </div>
          </form>
        </div>
      </div>

      <!-- Messages List -->
      <div class="messages-section">
        <h2 class="section-title">留言列表</h2>

        <!-- 优先显示 loading -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 仅在非 loading 且无留言时显示空状态 -->
        <div v-else-if="messages.length === 0" class="empty-state">
          <p>还没有留言，成为第一个留言的人吧！</p>
        </div>

        <div v-else class="messages-list" ref="messageListRef">
          <div
            v-for="(message, index) in displayedMessages"
            :key="message.id || index"
            :class="[
              'bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/60 dark:border-white/10 shadow-2xl hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all',
              `note-color-${index % 5}`,
            ]"
          >
            <div class="message-header">
              <div class="user-info">
                <div class="flex items-end gap-20px">
                  <div v-if="message.avatar" v-html="message.avatar"></div>
                  <h3 class="user-name">{{ message.name }}</h3>
                </div>
                <span class="message-time">{{
                  formatDate(message.createdAt)
                }}</span>
              </div>
              <div class="message-actions">
                <EmojiReaction
                  :message-id="message.id || index"
                  :reactions="message.reactions"
                />
                <a
                  v-if="message.website"
                  :href="message.website"
                  target="_blank"
                  class="website-link"
                  title="访问网站"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>
            </div>
            <p class="message-content">{{ message.content }}</p>
            <div class="message-meta">
              <span
                v-if="message.os || message.browser || message.deviceType"
                class="meta-chip"
              >
                <component
                  v-if="getOsIcon(message.os)"
                  :is="getOsIcon(message.os)"
                  class="meta-icon"
                />
                {{ message.os || "未知OS" }}
                <span class="meta-sep">·</span>
                <component
                  v-if="getBrowserIcon(message.browser)"
                  :is="getBrowserIcon(message.browser)"
                  class="meta-icon"
                />
                {{ message.browser || "未知浏览器" }}
                <template v-if="message.deviceType">
                  <span class="meta-sep">·</span>
                  <component
                    :is="getDeviceIcon(message.deviceType)"
                    class="meta-icon"
                  />
                  {{ message.deviceType }}
                </template>
              </span>
              <span v-if="message.location" class="meta-chip">
                来源：{{ formatLocation(message.location) }}
              </span>
            </div>
          </div>

          <!-- 加载更多提示 -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-if="hasMoreMessages && !isLoading" class="load-more-hint">
            向下滑动加载更多
          </div>

          <div
            v-if="!hasMoreMessages && displayedMessages.length > 0"
            class="no-more-state"
          >
            已加载全部留言
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ExternalLink,
  Apple,
  Chrome,
  Compass,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
} from "lucide-vue-next";
import { ElMessage } from "element-plus";
import EmojiReaction from "@/components/EmojiReaction.vue";
import AppButton from "@/components/ui/AppButton.vue";
import request from "@/api/request";
import { buildAvatarSvg } from "@/utils/avatarSvg";

interface MessageItem {
  id: string;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
  content: string;
  createdAt: string;
  reactions?: Record<string, number>;
  status?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  referer?: string;
  language?: string;
  location?: string | null;
}

interface FormData {
  name: string;
  email: string;
  website: string;
  message: string;
}

const formData = ref<FormData>({
  name: "",
  email: "",
  website: "",
  message: "",
});

const messages = ref<MessageItem[]>([]);
const totalMessages = ref(0);
const page = ref(1);
const pageSize = 10;
const isLoading = ref(false);
const submitting = ref(false);
const messageListRef = ref<HTMLElement>();

const displayedMessages = computed(() => messages.value);
const hasMoreMessages = computed(
  () => messages.value.length < totalMessages.value,
);

const mapMessage = (item: any): MessageItem | null => {
  const id = String(item?._id ?? item?.id ?? "");
  if (!id) return null;
  const location = (() => {
    if (!item?.location) return null;
    // 如果是字符串直接返回
    if (typeof item.location === "string") return item.location;
    // 对象场景：优先“国家 省份 城市”顺序
    const country = item.location.country || item.location.countryName || "";
    const region = item.location.region || item.location.province || "";
    const city = item.location.city || "";
    const parts = [country, region, city].filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  })();
  const referer = typeof item?.referer === "string" ? item.referer : "";
  return {
    id,
    name: item.name,
    email: item.email,
    website: item.website,
    avatar: item.avatar,
    content: item.content ?? item.message,
    createdAt: item.createdAt ?? item.time ?? new Date().toISOString(),
    reactions: item.reactions,
    status: item.status,
    browser: item.browser,
    os: item.os,
    deviceType: item.deviceType,
    referer,
    language: item.language,
    location,
  };
};

const svgToDataUrl = (svg: string) =>
  svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : "";

const fetchMessages = async (reset = false) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const targetPage = reset ? 1 : page.value;
    const res = await request.get("/messages", {
      params: { page: targetPage, pageSize, status: "approved" },
    });
    const list = (res as any)?.data ?? (res as any)?.items ?? res ?? [];
    const meta = (res as any)?.meta ?? (res as any)?.pagination ?? {};
    const mapped = Array.isArray(list)
      ? list.map(mapMessage).filter((m): m is MessageItem => Boolean(m))
      : [];

    // 为缺少头像的记录生成一个
    const mappedWithAvatar = await Promise.all(
      mapped.map(async (m) => {
        if (m.avatar) return m;
        const svg = await buildAvatarSvg();
        return { ...m, avatar: svg };
      }),
    );

    if (reset) {
      messages.value = [];
      page.value = 1;
    }

    messages.value = reset
      ? mappedWithAvatar
      : [...messages.value, ...mappedWithAvatar];
    totalMessages.value = Number(
      meta.total ?? totalMessages.value ?? messages.value.length,
    );

    if (mapped.length && !reset) {
      page.value += 1;
    } else if (reset && mapped.length) {
      page.value = 2;
    }
  } catch (error) {
    console.error("加载留言失败:", error);
    ElMessage.error("加载留言失败，请稍后再试");
  } finally {
    isLoading.value = false;
  }
};

const loadMoreMessages = () => {
  if (isLoading.value || !hasMoreMessages.value) return;
  fetchMessages();
};

const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollHeight - scrollTop - clientHeight < 300) {
    loadMoreMessages();
  }
};

onMounted(async () => {
  fetchMessages(true);
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

const submitMessage = async () => {
  if (
    !formData.value.name ||
    !formData.value.email ||
    !formData.value.message
  ) {
    ElMessage.warning("请填写所有必填项");
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    const websiteNormalized = normalizeWebsite(formData.value.website);
    const avatarSvg = await buildAvatarSvg();

    await request.post("/messages", {
      name: formData.value.name,
      email: formData.value.email,
      website: websiteNormalized || undefined,
      avatar: avatarSvg,
      content: formData.value.message,
    });

    formData.value = {
      name: "",
      email: "",
      website: "",
      message: "",
    };

    ElMessage.success("提交成功，待审核通过后展示");
    // 重新加载列表
    fetchMessages(true);
  } catch (error) {
    console.error("提交留言失败:", error);
    const msg =
      (error as any)?.response?.data?.message || "提交失败，请稍后再试";
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
};

// 规范化网站输入：自动补全协议，非法则置空
const normalizeWebsite = (url: string) => {
  if (!url) return "";
  let u = url.trim();
  if (!u) return "";
  // 已包含协议且合法
  try {
    new URL(u);
    return u;
  } catch {}
  // 缺失协议时补全 https://
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  try {
    new URL(u);
    return u;
  } catch {
    return "";
  }
};

const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return "昨天";
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString("zh-CN");
  }
};

const formatReferer = (ref: string) => {
  if (!ref) return "";
  try {
    const url = new URL(ref);
    return url.host + url.pathname.replace(/\/$/, "");
  } catch {
    return ref;
  }
};

// 格式化 location 字段为“国家 省份 城市”格式
const formatLocation = (loc: string | undefined | null) => {
  if (!loc) return "";
  // 已是格式化字符串
  if (typeof loc === "string") {
    // 若包含空格或分隔符，直接返回
    if (loc.includes("·") || loc.includes(" ")) return loc;
    return loc;
  }
  try {
    const obj = typeof loc === "string" ? JSON.parse(loc) : loc;
    if (!obj) return "";
    const country = obj.country || obj.countryName || "";
    const region = obj.region || obj.province || "";
    const city = obj.city || "";
    return [country, region, city].filter(Boolean).join(" ");
  } catch {
    return String(loc);
  }
};

const osIconMap: Record<string, any> = {
  macos: Apple,
  mac: Apple,
  windows: Laptop,
  win: Laptop,
  linux: Monitor,
};

const browserIconMap: Record<string, any> = {
  chrome: Chrome,
  safari: Compass,
  edge: Compass,
  firefox: Compass,
};

const deviceIconMap: Record<string, any> = {
  desktop: Monitor,
  laptop: Laptop,
  mobile: Smartphone,
  tablet: Smartphone,
};

const getOsIcon = (os?: string) => {
  if (!os) return null;
  const key = os.toLowerCase();
  return osIconMap[key] || Globe;
};

const getBrowserIcon = (browser?: string) => {
  if (!browser) return null;
  const key = browser.toLowerCase();
  return browserIconMap[key] || Globe;
};

const getDeviceIcon = (device?: string) => {
  if (!device) return null;
  const key = device.toLowerCase();
  return deviceIconMap[key] || Monitor;
};
</script>

<style scoped lang="scss">
@use "sass:list";
@use "@/style.scss" as *;



.messages-section {
  margin-top: $spacing-2xl;
}

.empty-state {
  text-align: center;
  padding: 40px $spacing-md;
  color: $color-text-gray-light;
  font-size: $font-lg;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.message-item {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: $spacing-lg;
  transition: all 0.3s ease;
  border: 1px solid rgba(209, 213, 219, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  @media (prefers-color-scheme: dark) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    border-color: rgba(59, 130, 246, 0.7);
    transform: translateY(-2px);
  }

  @media (prefers-color-scheme: dark) {
    &:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
      border-color: rgba(59, 130, 246, 0.5);
    }
  }

  // 便签样式
  @each $index, $colors in $note-colors {
    &.note-color-#{$index} {
      $light-start: list.nth($colors, 1);
      $light-end: list.nth($colors, 2);
      $dark-start: list.nth($colors, 3);
      $dark-end: list.nth($colors, 4);

      background: linear-gradient(135deg, $light-start 0%, $light-end 100%);
    }
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xs;
  gap: $spacing-xs;
}

.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $spacing-xs;
  margin-top: $spacing-xs;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: $font-xs;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: $font-xs;
  background: rgba(255, 255, 255, 0.6);
  color: #6b7280;
  border: 1px solid rgba(0, 0, 0, 0.05);
  gap: 4px;
}

@media (prefers-color-scheme: dark) {
  .meta-chip {
    background: rgba(255, 255, 255, 0.08);
    color: #a0aec0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.meta-sep {
  opacity: 0.6;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  flex-shrink: 0;
}

.user-name {
  font-size: $font-lg;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

@media (prefers-color-scheme: dark) {
  .user-name {
    color: white;
  }
}

.message-time {
  font-size: $font-xs;
  color: #9ca3af;
}

@media (prefers-color-scheme: dark) {
  .message-time {
    color: #6b7280;
  }
}

.website-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.5);
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.7);
    color: #1f2937;
  }
}

@media (prefers-color-scheme: dark) {
  .website-link {
    background: rgba(255, 255, 255, 0.1);
    color: #a0aec0;
  }

  .website-link:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #d1d5db;
  }
}

.message-content {
  color: #374151;
  font-size: $font-base;
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
}

@media (prefers-color-scheme: dark) {
  .message-content {
    color: #d1d5db;
  }
}

// 加载状态样式
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl $spacing-md;
  color: $color-text-gray;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $color-border;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: $spacing-md;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.load-more-hint {
  text-align: center;
  padding: $spacing-lg;
  color: $color-text-gray-light;
  font-size: $font-sm;
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
  padding: $spacing-lg;
  color: $color-text-gray-light;
  font-size: $font-sm;
}

@media (max-width: 768px) {
  .title {
    font-size: $font-3xl;
  }

  .message-form-section {
    padding: $spacing-lg;
  }

  .message-header {
    flex-direction: column;
  }

  .website-link {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .header {
    margin-bottom: $spacing-xl;
  }

  .message-form-section {
    padding: $spacing-md;
  }

  .section-title {
    font-size: $font-xl;
  }

  .form-input,
  .form-textarea {
    font-size: $font-lg;
  }
}
</style>
