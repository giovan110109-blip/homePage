<template>
  <div class="w-full">
    <!-- 评论输入框 -->
    <div
      class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-white/10 shadow-md"
    >
      <form @submit.prevent="onSubmit" class="space-y-3">
        <!-- 登录状态：显示用户信息 -->
        <div v-if="isLoggedIn" class="flex items-center gap-3 mb-2">
          <img
            :src="userAvatar"
            alt="avatar"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ userName }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">楼主</div>
          </div>
        </div>
        <!-- 未登录：显示输入框 -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="昵称*"
          />
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="邮箱*"
          />
          <input
            v-model="form.website"
            type="text"
            inputmode="url"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="网址（可选）"
            autocomplete="url"
          />
        </div>
        <div class="relative">
          <RichTextarea
            v-model="form.content"
            placeholder="请输入评论..."
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
          </transition>
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
        :is-logged-in="isLoggedIn"
        :user-name="userName"
        :user-email="userEmail"
        :user-avatar="userAvatar"
        @reply-submitted="fetchComments"
        @comment-deleted="fetchComments"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import request from "@/api/request";
import { buildAvatarSvg } from "@/utils/avatarSvg";
import { useAuthStore } from "@/stores/auth";
import AppButton from "@/components/ui/AppButton.vue";
import CommentItem from "@/components/ui/CommentItem.vue";
import EmotePicker from "@/components/ui/EmotePicker.vue";
import RichTextarea from "@/components/ui/RichTextarea.vue";
import { useEmotes } from "@/composables/useEmotes";

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

const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const userName = computed(
  () => authStore.user?.nickname || authStore.user?.username || "管理员",
);
const userEmail = computed(() => authStore.user?.email || "");
const userAvatar = computed(() => authStore.user?.avatar || "");

const COMMENT_FORM_KEY = "comment-form-cache";
const loadFormCache = () => {
  try {
    const cached = localStorage.getItem(COMMENT_FORM_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed;
    }
  } catch {}
  return { name: "", email: "", website: "", content: "" };
};

const saveFormCache = () => {
  if (!isLoggedIn.value) {
    localStorage.setItem(
      COMMENT_FORM_KEY,
      JSON.stringify({
        name: form.value.name,
        email: form.value.email,
        website: form.value.website,
      }),
    );
  }
};

const form = ref(loadFormCache());
const submitting = ref(false);
const loading = ref(false);
const comments = ref<CommentType[]>([]);
const showEmotePicker = ref(false);
const richTextareaRef = ref<InstanceType<typeof RichTextarea> | null>(null);
const emotePickerRef = ref<HTMLDivElement | null>(null);
const emoteButtonRef = ref<HTMLButtonElement | null>(null);
const emotePickerPosition = ref({ top: 0, right: 0 });

const { getEmoteUrl } = useEmotes();

const updateEmotePickerPosition = () => {
  if (!emoteButtonRef.value) return;

  const rect = emoteButtonRef.value.getBoundingClientRect();
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

  emotePickerPosition.value = {
    top,
    right,
  };
};

const toggleEmotePicker = () => {
  showEmotePicker.value = !showEmotePicker.value;
  if (showEmotePicker.value) {
    nextTick(() => {
      updateEmotePickerPosition();
    });
  }
};

const insertEmote = (emoteName: string) => {
  const emoteUrl = getEmoteUrl(emoteName);
  if (richTextareaRef.value && emoteUrl) {
    richTextareaRef.value.insertEmote(emoteName, emoteUrl);
  }
  showEmotePicker.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (emotePickerRef.value && !emotePickerRef.value.contains(target)) {
    showEmotePicker.value = false;
  }
};

const handleScroll = () => {
  if (showEmotePicker.value) {
    updateEmotePickerPosition();
  }
};

onMounted(() => {
  nextTick(() => {
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
  });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScroll, true);
  window.removeEventListener("resize", handleScroll);
});

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

const onSubmit = async () => {
  const name = isLoggedIn.value ? userName.value : form.value.name;
  const email = isLoggedIn.value ? userEmail.value : form.value.email;

  if (!form.value.content) {
    ElMessage.warning("请输入评论内容");
    return;
  }
  if (!isLoggedIn.value && (!name || !email)) {
    ElMessage.warning("请填写昵称和邮箱");
    return;
  }
  if (!props.targetId) {
    ElMessage.warning("无法确定评论目标");
    return;
  }
  submitting.value = true;
  try {
    const avatar =
      isLoggedIn.value && userAvatar.value
        ? userAvatar.value
        : await buildAvatarSvg();
    await request.post("/comments", {
      targetId: props.targetId,
      name: name || "楼主",
      email: email || "14945447@qq.com",
      website: form.value.website || undefined,
      avatar,
      content: form.value.content,
      isAdmin: isLoggedIn.value,
    });
    saveFormCache();
    form.value.content = "";
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
