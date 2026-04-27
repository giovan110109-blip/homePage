<template>
  <div class="theme-page min-h-screen py-16 sm:py-20">
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
                >昵称 <span class="text-red-500">*</span></label
              >
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
                >邮箱 <span class="text-red-500">*</span></label
              >
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
                >网站 (可选)</label
              >
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
                >留言内容 <span class="text-red-500">*</span></label
              >
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>
                <AppTransition
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
                        zIndex: 99999,
                      }"
                      ref="messageEmotePickerRef"
                      @click.stop
                    >
                      <EmotePicker @select="insertEmote" />
                    </div>
                  </Teleport>
                </AppTransition>
              </div>
            </div>
            <div
              class="space-y-3 rounded-2xl border border-gray-200/70 bg-white/50 px-4 py-4 dark:border-white/10 dark:bg-white/5"
            >
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="formData.isPrivate"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-transparent"
                />
                <span>
                  <span
                    class="block text-sm font-medium text-gray-800 dark:text-gray-200"
                    >私密留言</span
                  >
                </span>
              </label>
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="formData.requireEmailNotification"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-transparent"
                />
                <span>
                  <span
                    class="block text-sm font-medium text-gray-800 dark:text-gray-200"
                    >邮件通知</span
                  >
                </span>
              </label>
            </div>
            <div class="flex items-center justify-end space-x-4">
              <AppButton
                variant="primary"
                nativeType="submit"
                :disabled="submitting"
                >{{ submitting ? "提交中..." : "提交留言" }}</AppButton
              >
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

        <div
          v-if="!loading && messages.length === 0"
          class="text-center py-10 px-5 text-gray-400 dark:text-gray-500 text-base"
        >
          <p>还没有留言，成为第一个留言的人吧！</p>
        </div>

        <div
          v-if="messages.length > 0"
          class="flex flex-col gap-4"
          ref="messageListRef"
        >
          <div
            v-for="(message, index) in messages"
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
                    <div v-else v-html="sanitizeAvatar(message.avatar)"></div>
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
                评论{{
                  message.commentCount ? ` (${message.commentCount})` : ""
                }}
              </div>
            </div>
            <AppTransition
              enter-active-class="transition-all duration-800 ease-in-out overflow-hidden"
              leave-active-class="transition-all duration-800 ease-in-out overflow-hidden"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[600px] opacity-100"
              leave-from-class="max-h-[600px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <CommentBox v-if="showIndex === index" :target-id="message.id" />
            </AppTransition>
          </div>
          <div
            v-if="hasMore"
            ref="loadMoreSentinelRef"
            class="h-2 w-full"
            aria-hidden="true"
          ></div>
        </div>

        <div
          v-if="loading && messages.length === 0"
          class="flex flex-col items-center justify-center py-12 px-5"
        >
          <Loading />
        </div>

        <div
          v-if="loadingMore"
          class="flex flex-col items-center justify-center py-8 px-5"
        >
          <Loading />
        </div>

        <div
          v-if="hasMore && !loading && !loadingMore"
          class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm animate-fade-in-out"
        >
          即将自动加载更多
        </div>

        <div
          v-if="!hasMore && messages.length > 0"
          class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm"
        >
          已加载全部留言
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from "vue";
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
import AppTransition from "@/components/ui/AppTransition";
import AppButton from "@/components/ui/AppButton.vue";
import Loading from "@/components/ui/Loading.vue";
import CommentBox from "@/components/ui/CommentBox.vue";
import EmotePicker from "@/components/ui/EmotePicker.vue";
import EmoteRenderer from "@/components/ui/EmoteRenderer.vue";
import RichTextarea from "@/components/ui/RichTextarea.vue";
import request from "@/api/request";
import { formatRelativeTime } from "@/utils/format";
import { buildAvatarSvg } from "@/utils/avatarSvg";
import { getExternalLinkRedirectUrl } from "@/utils/external-link";
import { sanitizeSvg } from "@/utils/sanitize";
import { normalizeHttpUrl } from "@/utils/url";
import { useEmotePicker } from "@/composables/useEmotePicker";
import { useVisitorStore } from "@/stores/visitor";
import { usePagination } from "@/composables/usePagination";

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
  isPrivate: boolean;
  requireEmailNotification: boolean;
}

const visitorStore = useVisitorStore();
const formData = ref<FormData>({
  name: visitorStore.name,
  email: visitorStore.email,
  website: visitorStore.website,
  message: "",
  isPrivate: false,
  requireEmailNotification: true,
});
const submitting = ref(false);
const messageListRef = ref<HTMLElement>();
const loadMoreSentinelRef = ref<HTMLElement | null>(null);
const messageRichTextareaRef = ref<InstanceType<typeof RichTextarea> | null>(
  null,
);
const avatarCache = new Map<string, string>();
const processedMessageMap = new Map<string, MessageItem>();
let loadMoreObserver: IntersectionObserver | null = null;
let processToken = 0;

const {
  showEmotePicker,
  emotePickerRef: messageEmotePickerRef,
  emoteButtonRef: messageEmoteButtonRef,
  emotePickerPosition: messageEmotePickerPosition,
  toggleEmotePicker,
  selectEmote,
} = useEmotePicker({
  onInsert: (emoteName, emoteUrl) => {
    if (messageRichTextareaRef.value) {
      messageRichTextareaRef.value.insertEmote(emoteName, emoteUrl);
    }
  },
});

const mapMessage = (item: any): MessageItem | null => {
  const id = String(item?._id ?? item?.id ?? "");
  if (!id) return null;
  const location = (() => {
    if (!item?.location) return null;
    if (typeof item.location === "string") return item.location;
    const country = item.location.country || item.location.countryName || "";
    const region = item.location.region || item.location.province || "";
    const city = item.location.city || "";
    const parts = [country, region, city].filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  })();
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
    referer: typeof item?.referer === "string" ? item.referer : "",
    language: item.language,
    location,
  };
};

const {
  data: rawMessages,
  loading,
  loadingMore,
  hasMore,
  fetch: fetchMessages,
  loadMore,
  refresh,
} = usePagination<any>({
  fetcher: async (page, pageSize) => {
    const res = await request.get("/messages", {
      params: { page, pageSize, status: "approved" },
    });
    return {
      data: (res as any)?.data ?? [],
      meta: (res as any)?.meta ?? { page, pageSize, total: 0, pageCount: 1 },
    };
  },
  pageSize: 10,
});

const messages = ref<MessageItem[]>([]);

const buildFallbackAvatar = async (messageId: string) => {
  const cachedAvatar = avatarCache.get(messageId);
  if (cachedAvatar) return cachedAvatar;

  const avatarSvg = await buildAvatarSvg();
  avatarCache.set(messageId, avatarSvg);
  return avatarSvg;
};

const processMessages = async () => {
  const token = ++processToken;
  const mapped = rawMessages.value
    .map(mapMessage)
    .filter((m): m is MessageItem => Boolean(m));

  const nextIds = new Set(mapped.map((message) => message.id));

  processedMessageMap.forEach((_value, id) => {
    if (!nextIds.has(id)) {
      processedMessageMap.delete(id);
      avatarCache.delete(id);
    }
  });

  const missingAvatarMessages = mapped.filter(
    (message) => !message.avatar && !processedMessageMap.has(message.id),
  );

  if (missingAvatarMessages.length > 0) {
    const generatedAvatars = await Promise.all(
      missingAvatarMessages.map(async (message) => ({
        id: message.id,
        avatar: await buildFallbackAvatar(message.id),
      })),
    );

    if (token !== processToken) return;

    generatedAvatars.forEach(({ id, avatar }) => {
      avatarCache.set(id, avatar);
    });
  }

  messages.value = mapped.map((message) => {
    const avatar = message.avatar || avatarCache.get(message.id);
    const nextMessage = avatar ? { ...message, avatar } : message;
    processedMessageMap.set(message.id, nextMessage);
    return nextMessage;
  });
};

const ensureLoadMoreObserver = async () => {
  await nextTick();

  if (!loadMoreSentinelRef.value) return;

  if (!loadMoreObserver) {
    loadMoreObserver = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (
          !entry?.isIntersecting ||
          loading.value ||
          loadingMore.value ||
          !hasMore.value
        ) {
          return;
        }
        await loadMore();
      },
      {
        root: null,
        rootMargin: "0px 0px 420px 0px",
        threshold: 0,
      },
    );
  } else {
    loadMoreObserver.disconnect();
  }

  loadMoreObserver.observe(loadMoreSentinelRef.value);
};

watch(
  rawMessages,
  async () => {
    await processMessages();
    await ensureLoadMoreObserver();
  },
  { immediate: true },
);

watch(hasMore, async () => {
  if (!hasMore.value) {
    loadMoreObserver?.disconnect();
    return;
  }
  await ensureLoadMoreObserver();
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
      isPrivate: formData.value.isPrivate,
      requireEmailNotification: formData.value.requireEmailNotification,
    });
    visitorStore.setInfo({
      name: formData.value.name,
      email: formData.value.email,
      website: formData.value.website,
    });
    formData.value.message = "";
    formData.value.isPrivate = false;
    formData.value.requireEmailNotification = false;
    ElMessage.success("提交成功，待审核通过后展示");
    refresh();
  } catch (error) {
    console.error("提交留言失败:", error);
    const msg =
      (error as any)?.response?.data?.message || "提交失败，请稍后再试";
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
};

const normalizeWebsite = (url: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  return normalizeHttpUrl(
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
  );
};

const formatDate = formatRelativeTime;
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

const formatLocation = (loc: string | undefined | null) => {
  if (!loc) return "";
  if (typeof loc === "string") {
    if (loc.includes("·") || loc.includes(" ")) return loc;
    return loc;
  }
  return String(loc);
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

const getOsIcon = (os?: string) =>
  os ? osIconMap[os.toLowerCase()] || Globe : null;
const getBrowserIcon = (browser?: string) =>
  browser ? browserIconMap[browser.toLowerCase()] || Globe : null;
const getDeviceIcon = (device?: string) =>
  device ? deviceIconMap[device.toLowerCase()] || Monitor : null;

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

const isHttpAvatar = (avatar: string) =>
  typeof avatar === "string" && avatar.startsWith("http");

const sanitizeAvatar = (avatar: string) => {
  if (isHttpAvatar(avatar)) return avatar;
  return sanitizeSvg(avatar);
};

const showIndex = ref(-1);
const handelClick = (index: number) => {
  showIndex.value = showIndex.value === index ? -1 : index;
};

const insertEmote = (emoteName: string) => {
  selectEmote(emoteName);
};

onMounted(async () => {
  await fetchMessages();
  await ensureLoadMoreObserver();
});

onUnmounted(() => {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;
});
</script>
