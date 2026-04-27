<template>
  <div class="w-full">
    <!-- 评论输入框 -->
    <div
      class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-white/10 shadow-md"
    >
      <form @submit.prevent="onSubmit" class="space-y-3">
        <!-- 回复提示 -->
        <div v-if="replyTo" class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <span class="text-gray-600 dark:text-gray-400">回复</span>
          <span class="font-medium text-blue-600 dark:text-blue-400">@{{ replyTo.name }}</span>
          <button type="button" @click="cancelReply" class="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white"
            placeholder="昵称*"
          />
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white"
            placeholder="邮箱*"
          />
          <input
            v-model="form.website"
            type="text"
            inputmode="url"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white"
            placeholder="网址（可选）"
            autocomplete="url"
          />
        </div>
        <div class="relative">
          <RichTextarea
            v-model="form.content"
            :placeholder="replyTo ? `回复 @${replyTo.name}...` : '请输入评论...'"
            ref="richTextareaRef"
          />
          <button
            type="button"
            @click.stop="toggleEmotePicker"
            class="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            title="插入表情包"
            ref="emoteButtonRef"
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
                  top: emotePickerPosition.top + 'px',
                  right: emotePickerPosition.right + 'px',
                  zIndex: 99999,
                }"
                ref="emotePickerRef"
                @click.stop
              >
                <EmotePicker @select="insertEmote" />
              </div>
            </Teleport>
          </AppTransition>
        </div>
        <div class="flex items-center justify-end space-x-2">
          <AppButton
            variant="primary"
            nativeType="submit"
            :disabled="submitting"
          >
            {{ submitting ? "发送中..." : "发送" }}
          </AppButton>
        </div>
      </form>
    </div>

    <!-- 评论列表 -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-6 px-2"
    >
      <span>加载中...</span>
    </div>
    <div
      v-else-if="comments.length === 0"
      class="text-center px-2 text-gray-400 dark:text-gray-500 text-sm py-2"
    >
      <p>还没有评论，快来抢沙发吧！</p>
    </div>
    <div v-else class="flex flex-col gap-2 py-2">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :target-id="targetId"
        @reply="handleReply"
        @reply-submitted="fetchComments"
        @comment-deleted="fetchComments"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { X } from "lucide-vue-next";
import AppTransition from "@/components/ui/AppTransition";
import request from "@/api/request";
import { buildAvatarSvg } from "@/utils/avatarSvg";
import { useVisitorStore } from "@/stores/visitor";
import AppButton from "@/components/ui/AppButton.vue";
import CommentItem from "@/components/ui/CommentItem.vue";
import EmotePicker from "@/components/ui/EmotePicker.vue";
import RichTextarea from "@/components/ui/RichTextarea.vue";
import { useEmotePicker } from "@/composables/useEmotePicker";

interface CommentType {
  id: string;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  os?: string;
  browser?: string;
  deviceType?: string;
  location?: string | null;
  replies?: CommentType[];
}

const props = defineProps<{
  targetId: string;
}>();

const emit = defineEmits<{
  (e: "commented"): void;
}>();

const visitorStore = useVisitorStore();

const form = ref({
  name: visitorStore.name,
  email: visitorStore.email,
  website: visitorStore.website,
  content: ""
});

const replyTo = ref<CommentType | null>(null);
const submitting = ref(false);
const loading = ref(false);
const comments = ref<CommentType[]>([]);
const richTextareaRef = ref<InstanceType<typeof RichTextarea> | null>(null);

const {
  showEmotePicker,
  emotePickerRef,
  emoteButtonRef,
  emotePickerPosition,
  toggleEmotePicker,
  selectEmote,
} = useEmotePicker({
  onInsert: (emoteName, emoteUrl) => {
    if (richTextareaRef.value) {
      richTextareaRef.value.insertEmote(emoteName, emoteUrl);
    }
  },
});

const insertEmote = (emoteName: string) => {
  selectEmote(emoteName);
};

const fetchComments = async () => {
  if (!props.targetId) return;
  loading.value = true;
  try {
    const res = await request.get("/comments", {
      params: { targetId: props.targetId },
    });
    const list = (res as any)?.data ?? (res as any)?.items ?? res ?? [];
    const mapped = Array.isArray(list) ? list.map(mapComment) : [];
    comments.value = buildCommentTree(mapped);
  } catch (error) {
    console.error("加载评论失败:", error);
  } finally {
    loading.value = false;
  }
};

const mapComment = (
  item: any,
): (CommentType & { parentId?: string | null }) | null => {
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
    content: item.content,
    createdAt: item.createdAt ?? new Date().toISOString(),
    parentId: item.parentId ?? null,
    os: item.os,
    browser: item.browser,
    deviceType: item.deviceType,
    location,
  };
};

const buildCommentTree = (
  flatComments: (CommentType & { parentId?: string | null })[],
): CommentType[] => {
  const commentMap = new Map<string, CommentType>();
  const rootComments: CommentType[] = [];

  flatComments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  flatComments.forEach((comment) => {
    const node = commentMap.get(comment.id);
    if (!node) return;

    if (!comment.parentId) {
      rootComments.push(node);
    } else {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(node);
      } else {
        rootComments.push(node);
      }
    }
  });

  return rootComments;
};

const handleReply = (comment: CommentType) => {
  replyTo.value = comment
}

const cancelReply = () => {
  replyTo.value = null
}

const onSubmit = async () => {
  const name = form.value.name;
  const email = form.value.email;

  if (!form.value.content) {
    ElMessage.warning("请输入评论内容");
    return;
  }
  if (!name || !email) {
    ElMessage.warning("请填写昵称和邮箱");
    return;
  }
  if (!props.targetId) {
    ElMessage.warning("无法确定评论目标");
    return;
  }
  submitting.value = true;
  try {
    const avatar = await buildAvatarSvg();
    await request.post("/comments", {
      targetId: props.targetId,
      parentId: replyTo.value?.id || null,
      name: name || "楼主",
      email: email || "14945447@qq.com",
      website: form.value.website || undefined,
      avatar,
      content: form.value.content,
      isAdmin: false,
    });

    visitorStore.setInfo({
      name: form.value.name,
      email: form.value.email,
      website: form.value.website
    });

    form.value.content = "";
    replyTo.value = null;
    ElMessage.success("评论成功");
    await fetchComments();
    emit("commented");
  } catch (error) {
    console.error("评论失败:", error);
    const msg =
      (error as any)?.response?.data?.message || "评论失败，请稍后再试";
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.targetId,
  (newVal) => {
    if (newVal) {
      fetchComments();
    }
  },
  { immediate: true },
);
</script>
