<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span
          class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          >GUESTBOOK</span
        >
        <h1
          class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight"
        >
          留言板
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          在这里留下你的想法和建议，我会认真阅读每一条留言 💬。
        </p>
      </div>

      <!-- Message Form -->
      <div
        class="max-w-2xl mx-auto relative"
        :ref="(el) => (cardRef = el as HTMLElement)"
        @mousemove="handleCardMouseMove"
        @mouseleave="handleCardMouseLeave"
      >
        <!-- 鼠标跟随效果 -->
        <div
          v-if="cardEffect.show"
          class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
          :style="{
            left: cardEffect.x - 80 + 'px',
            top: cardEffect.y - 80 + 'px',
            background:
              'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.3) 30%, rgba(34, 197, 94, 0.15) 60%, transparent 90%)',
            boxShadow:
              '0 0 80px rgba(34, 197, 94, 0.5), 0 0 160px rgba(34, 197, 94, 0.3)',
          }"
        ></div>
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
              <div class="relative">
                <RichTextarea
                  v-model="formData.message"
                  placeholder="请输入你的留言..."
                  ref="messageRichTextareaRef"
                  customClass="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  @click.stop="toggleEmotePicker"
                  class="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                  title="插入表情包"
                  ref="messageEmoteButtonRef"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>
                <transition
                  enter-active-class="transition-all duration-200 ease-out"
                  leave-active-class="transition-all duration-150 ease-in"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <Teleport to="body">
                    <div 
                      v-if="showEmotePicker" 
                      class="fixed"
                      :style="{ 
                        top: messageEmotePickerPosition.top + 'px',
                        right: messageEmotePickerPosition.right + 'px',
                        zIndex: 99999
                      }"
                      ref="messageEmotePickerRef"
                      @click.stop
                    >
                      <EmotePicker @select="insertEmote" />
                    </div>
                  </Teleport>
                </transition>
              </div>
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
      <div class="mt-12">
        <h2
          class="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700"
        >
          留言列表
        </h2>

        <!-- 仅在首次加载且无留言时显示空状态 -->
        <div
          v-if="!isLoading && messages.length === 0"
          class="text-center py-10 px-5 text-gray-400 dark:text-gray-500 text-base"
        >
          <p>还没有留言，成为第一个留言的人吧！</p>
        </div>

        <!-- 留言列表 - 始终显示，加载更多时不隐藏 -->
        <div v-if="messages.length > 0" class="flex flex-col gap-4" ref="messageListRef">
          <div
            v-for="(message, index) in displayedMessages"
            :key="message.id || index"
            :class="[
              'bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/60 dark:border-white/10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] hover:border-blue-400/70 dark:hover:border-blue-400/50 hover:-translate-y-0.5 transition-all',
              getNoteClass(index),
            ]"
          >
            <div
              class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3"
            >
              <div class="flex flex-col gap-1 flex-1">
                <div class="flex items-end gap-5">
                  <div v-if="message.avatar">
                    <img
                      v-if="isHttpAvatar(message.avatar)"
                      :src="message.avatar"
                      alt="avatar"
                      class="w-11 h-11 rounded-full object-cover"
                    />
                    <div v-else v-html="message.avatar"></div>
                  </div>
                  <h3
                    class="text-base font-semibold text-gray-900 dark:text-white m-0"
                  >
                    {{ message.name }}
                  </h3>
                </div>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{
                  formatDate(message.createdAt)
                }}</span>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <EmojiReaction
                  :message-id="message.id || index"
                  :reactions="message.reactions"
                />
                <a
                  v-if="message.website"
                  :href="getWebsiteUrl(message.website)"
                  class="flex items-center justify-center w-8 h-8 rounded-md bg-white/50 text-gray-500 hover:bg-white/70 hover:text-gray-900 transition-all flex-shrink-0 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-300 self-start md:self-auto"
                  title="访问网站"
                  @click.prevent="handleWebsiteClick(message.website)"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>
            </div>
            <p
              class="text-gray-700 dark:text-gray-300 text-[15px] leading-6 m-0 break-words"
            >
              <EmoteRenderer :text="message.content" :size="100" />
            </p>
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap gap-2 my-3">
                <span
                  v-if="message.os || message.browser || message.deviceType"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-500 border border-black/5 dark:bg-white/10 dark:text-gray-400 dark:border-white/10"
                >
                  <component
                    v-if="getOsIcon(message.os)"
                    :is="getOsIcon(message.os)"
                    class="w-3.5 h-3.5"
                  />
                  {{ message.os || "未知OS" }}
                  <span class="opacity-60">·</span>
                  <component
                    v-if="getBrowserIcon(message.browser)"
                    :is="getBrowserIcon(message.browser)"
                    class="w-3.5 h-3.5"
                  />
                  {{ message.browser || "未知浏览器" }}
                  <template v-if="message.deviceType">
                    <span class="opacity-60">·</span>
                    <component
                      :is="getDeviceIcon(message.deviceType)"
                      class="w-3.5 h-3.5"
                    />
                    {{ message.deviceType }}
                  </template>
                </span>
                <span
                  v-if="message.location"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-500 border border-black/5 dark:bg-white/10 dark:text-gray-400 dark:border-white/10"
                >
                  来源：{{ formatLocation(message.location) }}
                </span>
              </div>
              <div
                class="text-xs text-gray-500 dark:text-gray-400 cursor-pointer whitespace-nowrap"
                @click="handelClick(index)"
              >
                评论{{ message.commentCount ? ` (${message.commentCount})` : '' }}
              </div>
            </div>
            <transition
              enter-active-class="transition-all duration-800 ease-in-out overflow-hidden"
              leave-active-class="transition-all duration-800 ease-in-out overflow-hidden"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[600px] opacity-100"
              leave-from-class="max-h-[600px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <CommentBox
                v-if="showIndex === index"
                :target-id="message.id"
              />
            </transition>
          </div>
        </div>

        <!-- 首次加载时的 Loading -->
        <div
          v-if="isLoading && messages.length === 0"
          class="flex flex-col items-center justify-center py-12 px-5"
        >
          <Loading />
        </div>

        <!-- 加载更多时的 Loading -->
        <div
          v-if="isLoading && messages.length > 0"
          class="flex flex-col items-center justify-center py-8 px-5"
        >
          <Loading />
        </div>

        <div
          v-if="hasMoreMessages && !isLoading"
          class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm animate-fade-in-out"
        >
          向下滑动加载更多
        </div>

        <div
          v-if="!hasMoreMessages && displayedMessages.length > 0"
          class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm"
        >
          已加载全部留言
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
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
import AppButton from "@/components/ui/AppButton.vue";
import Loading from "@/components/ui/Loading.vue";
import CommentBox from "@/components/ui/CommentBox.vue";
import EmotePicker from "@/components/ui/EmotePicker.vue";
import EmoteRenderer from "@/components/ui/EmoteRenderer.vue";
import RichTextarea from "@/components/ui/RichTextarea.vue";
import request from "@/api/request";
import { buildAvatarSvg } from "@/utils/avatarSvg";
import { getExternalLinkRedirectUrl } from "@/utils/external-link";
import { useEmotes } from "@/composables/useEmotes";
import { useVisitorStore } from "@/stores/visitor";

interface MessageItem {
  id: string;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
  content: string;
  createdAt: string;
  reactions?: Record<string, number>;
  commentCount?: number;
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

const visitorStore = useVisitorStore();

const formData = ref<FormData>({
  name: visitorStore.name,
  email: visitorStore.email,
  website: visitorStore.website,
  message: "",
});

const messages = ref<MessageItem[]>([]);
const totalMessages = ref(0);
const page = ref(1);
const pageSize = 10;
const isLoading = ref(false);
const submitting = ref(false);
const messageListRef = ref<HTMLElement>();
const showEmotePicker = ref(false);
const messageRichTextareaRef = ref<InstanceType<typeof RichTextarea> | null>(null);
const messageEmotePickerRef = ref<HTMLDivElement | null>(null);
const messageEmoteButtonRef = ref<HTMLButtonElement | null>(null);
const messageEmotePickerPosition = ref({ top: 0, right: 0 });

const { getEmoteUrl } = useEmotes();

const displayedMessages = computed(() => messages.value);
const hasMoreMessages = computed(
  () => messages.value.length < totalMessages.value,
);

const updateMessageEmotePickerPosition = () => {
  if (!messageEmoteButtonRef.value) return;

  const rect = messageEmoteButtonRef.value.getBoundingClientRect();
  const pickerWidth = Math.min(window.innerWidth - 32, 600);
  const pickerHeight = Math.min(window.innerHeight - 32, 450);

  let top = rect.top - pickerHeight - 8;
  let right = window.innerWidth - rect.right;

  if (top < 16) {
    top = rect.bottom + 8;
  }

  if (right < 16) {
    right = 16;
  }

  messageEmotePickerPosition.value = {
    top,
    right,
  };
};

const toggleEmotePicker = () => {
  showEmotePicker.value = !showEmotePicker.value;
  if (showEmotePicker.value) {
    nextTick(() => {
      updateMessageEmotePickerPosition();
    });
  }
};

const insertEmote = (emoteName: string) => {
  const emoteUrl = getEmoteUrl(emoteName);
  if (messageRichTextareaRef.value && emoteUrl) {
    messageRichTextareaRef.value.insertEmote(emoteName, emoteUrl);
  }
  showEmotePicker.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (messageEmotePickerRef.value && !messageEmotePickerRef.value.contains(target)) {
    showEmotePicker.value = false;
  }
};

const handleScroll = () => {
  if (showEmotePicker.value) {
    updateMessageEmotePickerPosition();
  }
};

const handleScrollForLoadMore = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollHeight - scrollTop - clientHeight < 300) {
    loadMoreMessages();
  }
};

onMounted(() => {
  nextTick(() => {
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleScroll);
});

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
    commentCount: item.commentCount || 0,
    status: item.status,
    browser: item.browser,
    os: item.os,
    deviceType: item.deviceType,
    referer,
    language: item.language,
    location,
  };
};

const fetchMessages = async (reset = false) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const targetPage = reset ? 1 : page.value;
    const res = await request.get("/messages", {
      params: { page: targetPage, pageSize, status: "approved" },
    });
    
    const list = (res as any)?.data ?? [];
    const meta = (res as any)?.meta ?? {};
    
    console.log('留言板数据:', { listLength: list?.length, meta, res });
    
    const mapped = Array.isArray(list)
      ? list.map(mapMessage).filter((m): m is MessageItem => Boolean(m))
      : [];

    const mappedWithAvatar = await Promise.all(
      mapped.map(async (m) => {
        if (m.avatar) return m;
        const svg = await buildAvatarSvg();
        return { ...m, avatar: svg };
      }),
    );

    if (reset) {
      messages.value = mappedWithAvatar;
      page.value = 2;
    } else {
      messages.value = [...messages.value, ...mappedWithAvatar];
      if (mapped.length) {
        page.value += 1;
      }
    }
    
    totalMessages.value = Number(meta.total ?? 0);
    console.log('留言板状态:', { 
      loaded: messages.value.length, 
      total: totalMessages.value, 
      hasMore: messages.value.length < totalMessages.value 
    });
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

onMounted(async () => {
  fetchMessages(true);
  window.addEventListener("scroll", handleScrollForLoadMore);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScrollForLoadMore);
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

    visitorStore.setInfo({
      name: formData.value.name,
      email: formData.value.email,
      website: formData.value.website
    });

    formData.value.message = "";

    ElMessage.success("提交成功，待审核通过后展示");
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
// 处理网站链接跳转
const getWebsiteUrl = (url: string) => {
  if (!url) return "#";
  const normalized = normalizeWebsite(url);
  if (!normalized) return "#";
  return getExternalLinkRedirectUrl(normalized);
};

const handleWebsiteClick = (url: string) => {
  const normalized = normalizeWebsite(url);
  if (!normalized) return;
  window.location.href = getExternalLinkRedirectUrl(normalized);
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

const getNoteClass = (index: number) => {
  const map: Record<number, string> = {
    0: "bg-gradient-to-br from-[#fef3c7] to-[#fde68a] dark:from-[#92400e] dark:to-[#78350f]",
    1: "bg-gradient-to-br from-[#fce7f3] to-[#fbcfe8] dark:from-[#831843] dark:to-[#500724]",
    2: "bg-gradient-to-br from-[#cffafe] to-[#a5f3fc] dark:from-[#164e63] dark:to-[#0e3a47]",
    3: "bg-gradient-to-br from-[#c7d2fe] to-[#a5b4fc] dark:from-[#312e81] dark:to-[#1e1b4b]",
    4: "bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] dark:from-[#064e3b] dark:to-[#042f2e]",
  };
  return map[index % 5];
};

const cardRef = ref<HTMLElement | null>(null);
const cardEffect = reactive<{ x: number; y: number; show: boolean }>({
  x: 0,
  y: 0,
  show: false,
});
const handleCardMouseMove = (event: MouseEvent) => {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  cardEffect.x = event.clientX - rect.left;
  cardEffect.y = event.clientY - rect.top;
  cardEffect.show = true;
};

const handleCardMouseLeave = () => {
  cardEffect.show = false;
};

const isHttpAvatar = (avatar: string) => {
  return typeof avatar === "string" && avatar.startsWith("http");
};

const showIndex = ref(-1);
const handelClick = (index) => {
  if (index === showIndex.value) {
    showIndex.value = -1;
    return;
  }
  showIndex.value = index;
};
</script>
