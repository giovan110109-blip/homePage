<template>
  <div class="comment-item">
    <div
      class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-gray-200/60 dark:border-white/10 shadow hover:shadow-lg dark:hover:shadow-blue-900/20 hover:border-blue-400/70 dark:hover:border-blue-400/50 hover:-translate-y-0.5 transition-all"
    >
      <div class="flex items-start justify-between gap-2 mb-1">
        <div class="flex items-center gap-2">
          <img
            v-if="comment.avatar"
            :src="comment.avatar"
            alt="avatar"
            class="w-8 h-8 rounded-full object-cover"
          />
          <span class="font-semibold text-gray-900 dark:text-white text-sm">{{
            comment.name
          }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-if="isLoggedIn"
            class="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            title="删除评论"
            @click="handleDelete"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
          <a
            v-if="comment.website"
            :href="getWebsiteUrl(comment.website)"
            class="flex items-center justify-center w-7 h-7 rounded-md bg-white/50 text-gray-500 hover:bg-white/70 hover:text-gray-900 transition-all flex-shrink-0 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-300"
            title="访问网站"
            @click.prevent="handleWebsiteClick(comment.website)"
          >
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <div
        class="text-gray-700 dark:text-gray-300 text-[13px] leading-5 m-0 break-words mb-1"
      >
        <EmoteRenderer :text="comment.content" :size="100" />
      </div>
      <div class="flex justify-between items-center">
        <div class="flex flex-wrap gap-2">
          <span
            v-if="comment.os || comment.browser || comment.deviceType"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-500 border border-black/5 dark:bg-white/10 dark:text-gray-400 dark:border-white/10"
          >
            <component
              v-if="getOsIcon(comment.os)"
              :is="getOsIcon(comment.os)"
              class="w-3 h-3"
            />
            {{ comment.os || "未知OS" }}
            <span class="opacity-60">·</span>
            <component
              v-if="getBrowserIcon(comment.browser)"
              :is="getBrowserIcon(comment.browser)"
              class="w-3 h-3"
            />
            {{ comment.browser || "未知浏览器" }}
            <template v-if="comment.deviceType">
              <span class="opacity-60">·</span>
              <component
                :is="getDeviceIcon(comment.deviceType)"
                class="w-3 h-3"
              />
              {{ comment.deviceType }}
            </template>
          </span>
          <span
            v-if="comment.location"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-500 border border-black/5 dark:bg-white/10 dark:text-gray-400 dark:border-white/10"
          >
            来源：{{ formatLocation(comment.location) }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ formatDate(comment.createdAt) }}
          </span>
        </div>
        <button
          class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer whitespace-nowrap"
          @click="$emit('reply', comment)"
        >
          回复
        </button>
      </div>
    </div>

    <!-- 子评论（递归） -->
    <div
      v-if="comment.replies && comment.replies.length > 0"
      class="ml-4 mt-2 flex flex-col gap-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3"
    >
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :target-id="targetId"
        :parent-id="comment.id"
        :is-logged-in="isLoggedIn"
        :user-name="userName"
        :user-email="userEmail"
        :user-avatar="userAvatar"
        @reply="$emit('reply', $event)"
        @reply-submitted="$emit('reply-submitted')"
        @comment-deleted="$emit('comment-deleted')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ExternalLink,
  Trash2,
  Apple,
  Chrome,
  Compass,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
} from "lucide-vue-next";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/api/request";
import { getExternalLinkRedirectUrl } from "@/utils/external-link";
import EmoteRenderer from "@/components/ui/EmoteRenderer.vue";

interface CommentType {
  id: string;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
  content: string;
  createdAt: string;
  os?: string;
  browser?: string;
  deviceType?: string;
  location?: string | null;
  replies?: CommentType[];
}

const props = defineProps<{
  comment: CommentType;
  targetId: string;
  parentId?: string;
  isLoggedIn?: boolean;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}>();

const emit = defineEmits<{
  (e: "reply", comment: CommentType): void;
  (e: "reply-submitted"): void;
  (e: "comment-deleted"): void;
}>();

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？", "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await request.delete(`/admin/comments/${props.comment.id}`);
    ElMessage.success("评论已删除");
    emit("comment-deleted");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      const msg = (error as any)?.response?.data?.message || "删除失败，请稍后再试";
      ElMessage.error(msg);
    }
  }
};

const normalizeWebsite = (url: string) => {
  if (!url) return "";
  let u = url.trim();
  if (!u) return "";
  try {
    new URL(u);
    return u;
  } catch {}
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    new URL(u);
    return u;
  } catch {
    return "";
  }
};

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

function formatDate(value: string | Date) {
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
}
</script>
