<template>
  <div class="theme-page min-h-screen py-16 sm:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span class="passport-kicker">
          <Stamp class="h-4 w-4" />
          VISITOR PASSPORT
        </span>
        <h1
          class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight"
        >
          访客护照
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          每一条留言，都是这个站点给访客盖下的一枚章。
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
              'radial-gradient(circle, color-mix(in srgb, var(--theme-accent) 42%, transparent) 0%, color-mix(in srgb, var(--theme-accent) 22%, transparent) 34%, color-mix(in srgb, var(--theme-accent) 10%, transparent) 62%, transparent 90%)',
            boxShadow:
              '0 0 80px color-mix(in srgb, var(--theme-accent) 28%, transparent), 0 0 160px color-mix(in srgb, var(--theme-accent) 16%, transparent)',
          }"
        ></div>
        <div
          class="passport-entry-card relative bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-200/60 dark:border-white/10 shadow-2xl mb-8"
        >
          <div class="passport-preview-stamp" :class="{ active: isStampReady }">
            <span>Giovan</span>
            <strong>{{ formStampLabel }}</strong>
            <small>{{ isStampReady ? "READY" : "WAITING" }}</small>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            入境登记卡
          </h2>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
            填完姓名与入境备注后，右上角会点亮你的预览章。
          </p>
          <form @submit.prevent="submitMessage" class="space-y-6">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >访客姓名 <span class="text-red-500">*</span></label
              >
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="写下你的访客姓名"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >回信地址 <span class="text-red-500">*</span></label
              >
              <input
                v-model="formData.email"
                type="email"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="用于回信与生成访客身份"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >随身站点 (可选)</label
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
                >入境备注 <span class="text-red-500">*</span></label
              >
              <div class="relative">
                <RichTextarea
                  v-model="formData.message"
                  placeholder="写下这一站的入境备注..."
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
              class="passport-options-panel space-y-3 rounded-2xl border px-4 py-4"
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
                >{{ submitting ? "正在盖章..." : "盖章入境" }}</AppButton
              >
            </div>
          </form>
        </div>
        <Teleport to="body">
          <AppTransition
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="stampSuccessVisible && latestPassport"
              class="stamp-ticket-modal"
              role="dialog"
              aria-modal="true"
              aria-label="留言成功机票"
              @click.self="closeStampModal"
            >
              <div class="stamp-ticket-modal__stage">
                <VisitorPassportCard
                  :name="latestPassport.name"
                  :avatar="latestPassport.avatar"
                  :location="latestPassport.location"
                  :browser="latestPassport.browser"
                  :os="latestPassport.os"
                  :device-type="latestPassport.deviceType"
                  :created-at="latestPassport.createdAt"
                  :visitor-number="latestPassport.visitorNumber"
                  :badge="getPrimaryBadge(latestPassport)"
                  @close="closeStampModal"
                />
              </div>
            </div>
          </AppTransition>
        </Teleport>
      </div>

      <!-- Messages List -->
      <div class="mt-12">
        <div class="mb-6 border-b border-gray-200 pb-5 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            护照页
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ passportStats.total }} 枚入境章 ·
            {{ passportStats.withWebsite }} 位有站之人 ·
            {{ passportStats.oldFriends }} 位老朋友
          </p>
        </div>

        <div
          v-if="!loading && messages.length === 0"
          class="text-center py-10 px-5 text-gray-400 dark:text-gray-500 text-base"
        >
          <p>还没有访客盖章。要不要成为第一位？</p>
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
              'passport-message-card relative bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/60 dark:border-white/10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] hover:border-amber-500/50 dark:hover:border-amber-300/40 hover:-translate-y-0.5 transition-all',
              getNoteClass(index),
            ]"
          >
            <div class="passport-card-stamp" aria-hidden="true">
              <span>Giovan</span>
              <strong>{{ getPrimaryBadge(message) }}</strong>
            </div>
            <div
              class="relative flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3"
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
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="badge in getMessageBadges(message)"
                    :key="`${message.id}-${badge}`"
                    class="passport-badge"
                  >
                    {{ badge }}
                  </span>
                </div>
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
              class="relative text-gray-700 dark:text-gray-300 text-[15px] leading-6 m-0 break-words"
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
            v-if="canLoadMore"
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
          v-if="canLoadMore && !loading && !loadingMore"
          class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm animate-fade-in-out"
        >
          即将自动加载更多
        </div>

        <div
          v-if="!canLoadMore && messages.length > 0"
          class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm"
        >
          护照翻到底了，欢迎下次再来
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  computed,
} from "vue";
import {
  ExternalLink,
  Apple,
  Chrome,
  Compass,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
  Stamp,
} from "lucide-vue-next";
import { ElMessage } from "element-plus";
import AppTransition from "@/components/ui/AppTransition";
import AppButton from "@/components/ui/AppButton.vue";
import Loading from "@/components/ui/Loading.vue";
import CommentBox from "@/components/ui/CommentBox.vue";
import EmotePicker from "@/components/ui/EmotePicker.vue";
import EmoteRenderer from "@/components/ui/EmoteRenderer.vue";
import RichTextarea from "@/components/ui/RichTextarea.vue";
import VisitorPassportCard from "@/components/guestbook/VisitorPassportCard.vue";
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
  visitorNumber?: number | null;
  visitorMessageCount?: number;
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

interface PassportStats {
  total: number;
  withWebsite: number;
  oldFriends: number;
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
const stampSuccessVisible = ref(false);
const latestPassport = ref<MessageItem | null>(null);
const messageListRef = ref<HTMLElement>();
const loadMoreSentinelRef = ref<HTMLElement | null>(null);
const messageRichTextareaRef = ref<InstanceType<typeof RichTextarea> | null>(
  null,
);
const avatarCache = new Map<string, string>();
const processedMessageMap = new Map<string, MessageItem>();
let loadMoreObserver: IntersectionObserver | null = null;
let stampSuccessTimer: number | null = null;
let processToken = 0;
let previousBodyOverflow = "";
const MESSAGE_PAGE_SIZE = 10;
const reachedMessageEnd = ref(false);
const totalPassportStats = ref<PassportStats | null>(null);

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

const normalizePassportStats = (payload: any): PassportStats | null => {
  if (!payload || typeof payload !== "object") return null;
  const nestedStats = payload.passportStats;
  const hasStats =
    typeof payload.withWebsite !== "undefined" ||
    typeof payload.oldFriends !== "undefined" ||
    typeof nestedStats?.withWebsite !== "undefined" ||
    typeof nestedStats?.oldFriends !== "undefined";

  if (!hasStats) return null;

  return {
    total: Number(payload.total || 0),
    withWebsite: Number(payload.withWebsite ?? nestedStats?.withWebsite ?? 0),
    oldFriends: Number(payload.oldFriends ?? nestedStats?.oldFriends ?? 0),
  };
};

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
    visitorNumber:
      Number(item.visitorNumber) > 0 ? Number(item.visitorNumber) : null,
    visitorMessageCount:
      Number(item.visitorMessageCount) > 0
        ? Number(item.visitorMessageCount)
        : undefined,
    location,
  };
};

const {
  data: rawMessages,
  loading,
  loadingMore,
  hasMore,
  meta: paginationMeta,
  fetch: fetchMessages,
  loadMore,
  refresh,
} = usePagination<any>({
  fetcher: async (page, pageSize) => {
    const res = await request.get("/messages", {
      params: { page, pageSize, status: "approved" },
    });
    const metaStats = normalizePassportStats((res as any)?.meta);
    if (metaStats) totalPassportStats.value = metaStats;
    return {
      data: (res as any)?.data ?? [],
      meta: (res as any)?.meta ?? { page, pageSize, total: 0, pageCount: 1 },
    };
  },
  pageSize: MESSAGE_PAGE_SIZE,
});

const messages = ref<MessageItem[]>([]);
const canLoadMore = computed(() => hasMore.value && !reachedMessageEnd.value);
const isStampReady = computed(() =>
  Boolean(formData.value.name.trim() && formData.value.message.trim()),
);
const formStampLabel = computed(() => {
  const name = formData.value.name.trim();
  return name ? name.slice(0, 8).toUpperCase() : "GUEST";
});

const visitorMessageCount = computed(() => {
  const counts = new Map<string, number>();
  messages.value.forEach((message) => {
    const key = message.email?.trim().toLowerCase();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
});

const getMessageBadges = (message: MessageItem) => {
  const badges = new Set<string>();
  const visitorKey = message.email?.trim().toLowerCase();
  const visitCount =
    Number(message.visitorMessageCount) > 0
      ? Number(message.visitorMessageCount)
      : visitorKey
        ? visitorMessageCount.value.get(visitorKey) || 1
        : 1;
  const createdHour = new Date(message.createdAt).getHours();

  badges.add(visitCount >= 2 ? "老朋友" : "新来的朋友");
  if (createdHour >= 0 && createdHour < 5) badges.add("深夜访客");
  if (message.deviceType?.toLowerCase().includes("mobile"))
    badges.add("移动端旅人");
  if (message.deviceType?.toLowerCase().includes("desktop"))
    badges.add("桌面访客");
  if (message.website) badges.add("有站之人");
  if (/\[emote:|emote-webp|<img/i.test(message.content || ""))
    badges.add("表情玩家");
  if (message.location && !String(message.location).includes("中国"))
    badges.add("远方来客");
  return [...badges].slice(0, 4);
};

const getPrimaryBadge = (message: MessageItem) =>
  getMessageBadges(message)[0] || "访客";

const getDisplayVisitorNumber = (message: MessageItem, index = 0) => {
  if (message.visitorNumber && message.visitorNumber > 0)
    return message.visitorNumber;
  const fallback =
    Number(paginationMeta.value.total || messages.value.length) - index;
  return fallback > 0 ? fallback : undefined;
};

const closeStampModal = () => {
  stampSuccessVisible.value = false;
  if (stampSuccessTimer) {
    window.clearTimeout(stampSuccessTimer);
    stampSuccessTimer = null;
  }
};

const passportStats = computed(() => ({
  total:
    totalPassportStats.value?.total ??
    paginationMeta.value.total ??
    messages.value.length,
  withWebsite:
    totalPassportStats.value?.withWebsite ??
    messages.value.filter((message) => Boolean(message.website)).length,
  oldFriends:
    totalPassportStats.value?.oldFriends ??
    messages.value.filter((message) =>
      getMessageBadges(message).includes("老朋友"),
    ).length,
}));

const fetchPassportStats = async () => {
  try {
    const res: any = await request.get("/messages/stats");
    const stats = normalizePassportStats(res?.data);
    if (stats) totalPassportStats.value = stats;
  } catch (error) {
    console.error("获取留言统计失败:", error);
  }
};

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

  if (!loadMoreSentinelRef.value || !canLoadMore.value) return;

  if (!loadMoreObserver) {
    loadMoreObserver = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (
          !entry?.isIntersecting ||
          loading.value ||
          loadingMore.value ||
          !canLoadMore.value
        ) {
          return;
        }
        await loadMoreMessages();
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

const loadMoreMessages = async () => {
  const previousLength = rawMessages.value.length;
  await loadMore();

  const appendedCount = rawMessages.value.length - previousLength;
  if (appendedCount <= 0 || appendedCount < MESSAGE_PAGE_SIZE) {
    reachedMessageEnd.value = true;
    loadMoreObserver?.disconnect();
  }
};

watch(
  rawMessages,
  async () => {
    await processMessages();
    await ensureLoadMoreObserver();
  },
  { immediate: true },
);

watch(canLoadMore, async () => {
  if (!canLoadMore.value) {
    loadMoreObserver?.disconnect();
    return;
  }
  await ensureLoadMoreObserver();
});

watch(stampSuccessVisible, (visible) => {
  if (typeof document === "undefined") return;

  if (visible) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
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
    const res: any = await request.post("/messages", {
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

    const fallbackPassport: MessageItem = {
      id: `preview-${Date.now()}`,
      name: formData.value.name,
      email: formData.value.email,
      website: websiteNormalized,
      avatar: avatarSvg,
      content: formData.value.message,
      createdAt: new Date().toISOString(),
      deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent)
        ? "mobile"
        : "desktop",
      visitorNumber:
        Number(paginationMeta.value.total || messages.value.length) + 1,
      location: null,
    };
    const createdMessage = mapMessage(res?.data) || fallbackPassport;
    latestPassport.value = {
      ...createdMessage,
      visitorNumber:
        createdMessage.visitorNumber || fallbackPassport.visitorNumber,
    };
    if (stampSuccessTimer) {
      window.clearTimeout(stampSuccessTimer);
      stampSuccessTimer = null;
    }
    stampSuccessVisible.value = true;
    formData.value.message = "";
    formData.value.isPrivate = false;
    formData.value.requireEmailNotification = false;
    ElMessage.success("已盖章，欢迎入境");
    reachedMessageEnd.value = false;
    await Promise.all([refresh(), fetchPassportStats()]);
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
  reachedMessageEnd.value = false;
  await Promise.all([fetchMessages(), fetchPassportStats()]);
  await ensureLoadMoreObserver();
});

onUnmounted(() => {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;
  if (stampSuccessTimer) {
    window.clearTimeout(stampSuccessTimer);
    stampSuccessTimer = null;
  }
  if (typeof document !== "undefined") {
    document.body.style.overflow = previousBodyOverflow;
  }
});
</script>

<style scoped>
.stamp-ticket-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(
      circle at 50% 36%,
      color-mix(in srgb, var(--theme-accent) 18%, transparent),
      transparent 34%
    ),
    rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(14px);
}

.stamp-ticket-modal__stage {
  width: min(680px, 100%);
  animation: ticketModalPop 420ms cubic-bezier(0.19, 1, 0.22, 1) both;
}

.stamp-ticket-modal__stage :deep(.visitor-passport-card) {
  width: 100%;
  margin: 0;
}

@keyframes ticketModalPop {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.94) rotateX(10deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0);
  }
}

.passport-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.passport-entry-card {
  --passport-ink: var(--theme-text-primary);
  --passport-muted: var(--theme-text-muted);
  --passport-border: var(--theme-border);
  --passport-border-strong: var(--theme-border-strong);
  --passport-field: color-mix(
    in srgb,
    var(--theme-surface-strong) 78%,
    transparent
  );
  --passport-field-focus: var(--theme-surface-strong);
  --passport-accent: var(--theme-accent);
  --passport-accent-strong: var(--theme-accent-strong);
  --passport-accent-soft: var(--theme-accent-soft);
  color: var(--passport-ink);
  background:
    radial-gradient(
      circle at 18% 0%,
      color-mix(in srgb, var(--theme-accent) 18%, transparent),
      transparent 34%
    ),
    linear-gradient(135deg, var(--theme-surface-strong), var(--theme-surface)),
    repeating-linear-gradient(
      0deg,
      color-mix(in srgb, var(--theme-accent) 4%, transparent) 0 1px,
      transparent 1px 8px
    );
  border-color: var(--passport-border) !important;
  box-shadow: var(--theme-shadow-lg);
}

.passport-entry-card::before {
  content: "";
  position: absolute;
  inset: 14px;
  pointer-events: none;
  border: 1px dashed
    color-mix(in srgb, var(--theme-accent) 24%, var(--theme-border));
  border-radius: 22px;
}

.passport-entry-card::after {
  content: "";
  position: absolute;
  right: -42px;
  top: -46px;
  width: 190px;
  height: 190px;
  pointer-events: none;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    var(--passport-accent-soft),
    transparent 68%
  );
}

.passport-entry-card h2 {
  position: relative;
  z-index: 1;
  color: var(--passport-ink) !important;
  letter-spacing: -0.03em;
}

.passport-entry-card p,
.passport-entry-card label,
.passport-entry-card :deep(label) {
  color: var(--passport-muted) !important;
}

.passport-entry-card form,
.passport-entry-card .passport-preview-stamp {
  z-index: 1;
}

.passport-entry-card form {
  position: relative;
}

.passport-preview-stamp {
  position: absolute;
  right: 24px;
  top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border: 2px dashed
    color-mix(in srgb, var(--theme-text-muted) 42%, transparent);
  border-radius: 999px;
  color: color-mix(in srgb, var(--theme-text-muted) 72%, transparent);
  font-family: Georgia, "Times New Roman", serif;
  letter-spacing: 0.08em;
  text-align: center;
  transform: rotate(-10deg);
  transition: all 220ms ease;
}

.passport-preview-stamp.active {
  border-color: color-mix(in srgb, var(--theme-accent) 72%, transparent);
  color: var(--theme-accent-strong);
  box-shadow: inset 0 0 0 5px var(--theme-accent-soft);
}

.passport-preview-stamp span,
.passport-preview-stamp small {
  font-size: 10px;
  font-weight: 800;
}

.passport-preview-stamp strong {
  max-width: 72px;
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.passport-entry-card :deep(input[type="text"]),
.passport-entry-card :deep(input[type="email"]),
.passport-entry-card :deep(input[type="url"]),
.passport-entry-card :deep(textarea),
.passport-entry-card :deep([contenteditable="true"]) {
  color: var(--passport-ink) !important;
  caret-color: var(--passport-accent);
  background: var(--passport-field) !important;
  border-color: var(--passport-border) !important;
  box-shadow: inset 0 1px 0
    color-mix(in srgb, var(--theme-bg-elevated) 34%, transparent);
}

.passport-entry-card :deep(input::placeholder),
.passport-entry-card :deep(textarea::placeholder) {
  color: color-mix(in srgb, var(--passport-muted) 72%, transparent) !important;
}

.passport-entry-card :deep(input:focus),
.passport-entry-card :deep(textarea:focus),
.passport-entry-card :deep([contenteditable="true"]:focus) {
  background: var(--passport-field-focus) !important;
  border-color: var(--passport-accent) !important;
  box-shadow:
    0 0 0 3px var(--passport-accent-soft),
    inset 0 1px 0 color-mix(in srgb, var(--theme-bg-elevated) 34%, transparent) !important;
}

.passport-options-panel {
  background: color-mix(in srgb, var(--theme-surface-soft) 78%, transparent);
  border-color: var(--passport-border) !important;
}

.passport-options-panel :deep(span) {
  color: var(--passport-ink) !important;
}

.passport-entry-card :deep(input[type="checkbox"]) {
  color: var(--passport-accent) !important;
  border-color: var(--passport-border-strong) !important;
}

.passport-entry-card :deep(button[type="submit"]) {
  border: 1px solid color-mix(in srgb, var(--passport-accent) 42%, transparent) !important;
  color: var(--theme-bg-elevated) !important;
  background: linear-gradient(
    135deg,
    var(--passport-accent-strong),
    var(--passport-accent)
  ) !important;
  box-shadow: 0 14px 34px
    color-mix(in srgb, var(--passport-accent) 24%, transparent) !important;
}

.stamp-success-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: -6px auto 24px;
  padding: 14px 18px;
  border: 1px solid rgba(185, 28, 28, 0.22);
  border-radius: 24px;
  color: #7f1d1d;
  background: rgba(255, 247, 237, 0.92);
  box-shadow: 0 18px 50px rgba(127, 29, 29, 0.14);
}

:global(.dark) .stamp-success-card {
  color: #fecaca;
  background: rgba(69, 26, 3, 0.76);
}

.stamp-success-mark {
  display: grid;
  place-items: center;
  flex: 0 0 74px;
  height: 74px;
  border: 2px solid currentColor;
  border-radius: 999px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  transform: rotate(-9deg);
  animation: stampDrop 560ms cubic-bezier(0.18, 0.88, 0.26, 1.15) both;
}

.stamp-success-card strong,
.stamp-success-card span {
  display: block;
}

.stamp-success-card span {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.72;
}

.passport-message-card::before {
  content: "";
  position: absolute;
  inset: 12px;
  pointer-events: none;
  border: 1px dashed rgba(120, 53, 15, 0.16);
  border-radius: 22px;
}

.passport-message-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 12% 18%,
      rgba(255, 255, 255, 0.32),
      transparent 25%
    ),
    repeating-linear-gradient(
      0deg,
      rgba(120, 53, 15, 0.035) 0 1px,
      transparent 1px 9px
    );
  mix-blend-mode: soft-light;
}

.passport-card-stamp {
  position: absolute;
  right: 64px;
  bottom: 26px;
  z-index: 0;
  pointer-events: none;
  opacity: 0.54;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 106px;
  height: 106px;
  border: 2px dashed
    color-mix(in srgb, var(--theme-text-muted) 42%, transparent);
  border-radius: 999px;
  color: color-mix(in srgb, var(--theme-text-muted) 72%, transparent);
  font-family: Georgia, "Times New Roman", serif;
  text-align: center;
  transform: rotate(-12deg);
  transition: all 220ms ease;
}

:global(.dark) .passport-card-stamp {
  opacity: 0.62;
}

.passport-message-card {
  overflow: visible;
  isolation: isolate;
}

.passport-message-card > :not(.passport-card-stamp) {
  position: relative;
  z-index: 1;
}

.passport-card-stamp span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.passport-card-stamp strong {
  max-width: 72px;
  margin-top: 3px;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.passport-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid rgba(180, 83, 9, 0.22);
  border-radius: 999px 999px 999px 4px;
  color: #92400e;
  background: rgba(254, 243, 199, 0.78);
  font-size: 12px;
  font-weight: 700;
  transform: rotate(-1deg);
}

.passport-badge--rank {
  color: #7f1d1d;
  background: rgba(254, 226, 226, 0.78);
  border-color: rgba(185, 28, 28, 0.2);
}

:global(.dark) .passport-badge {
  color: #fde68a;
  background: rgba(120, 53, 15, 0.5);
  border-color: rgba(253, 230, 138, 0.18);
}

:global(.dark) .passport-badge--rank {
  color: #fecaca;
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(252, 165, 165, 0.16);
}

@keyframes stampDrop {
  0% {
    opacity: 0;
    transform: translateY(-28px) scale(1.28) rotate(-9deg);
  }
  58% {
    opacity: 1;
    transform: translateY(3px) scale(0.92) rotate(-9deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(-9deg);
  }
}

@media (max-width: 640px) {
  .passport-preview-stamp {
    right: 18px;
    top: 18px;
    width: 82px;
    height: 82px;
  }

  .passport-card-stamp {
    width: 84px;
    height: 84px;
    right: 44px;
    bottom: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stamp-success-mark {
    animation: none;
  }
}
</style>
