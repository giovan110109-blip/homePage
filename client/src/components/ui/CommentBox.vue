<template>
  <div class="w-full">
    <!-- 评论输入框 -->
    <div
      class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-white/10 shadow-md"
    >
      <form @submit.prevent="onSubmit" class="space-y-3">
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="form.nickname"
            type="text"
            required
            class="w-full sm:w-1/4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            placeholder="昵称*"
          />
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full sm:w-1/4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            placeholder="邮箱*"
          />
          <input
            v-model="form.website"
            type="text"
            inputmode="url"
            class="w-full sm:w-1/4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            placeholder="网址（可选）"
            autocomplete="url"
          />
        </div>
        <textarea
          v-model="form.content"
          required
          rows="2"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
          placeholder="请输入评论..."
        ></textarea>
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
      <div
        v-for="(comment, idx) in comments"
        :key="comment.id || idx"
        class="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-gray-200/60 dark:border-white/10 shadow hover:shadow-lg dark:hover:shadow-blue-900/20 hover:border-blue-400/70 dark:hover:border-blue-400/50 hover:-translate-y-0.5 transition-all"
      >
        <div class="flex items-center gap-2 mb-1">
          <img
            v-if="comment.avatar"
            :src="comment.avatar"
            alt="avatar"
            class="w-8 h-8 rounded-full object-cover"
          />
          <span class="font-semibold text-gray-900 dark:text-white text-sm">{{
            comment.nickname
          }}</span>
          <a
            v-if="comment.website"
            :href="normalizeWebsite(comment.website)"
            target="_blank"
            rel="noopener"
            class="text-xs text-blue-500 hover:underline ml-1"
            >网站</a
          >
        </div>
        <div
          class="text-gray-700 dark:text-gray-300 text-[13px] leading-5 m-0 break-words mb-1"
        >
          {{ comment.content }}
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
          {{ formatDate(comment.createdAt) }}
        </div>
        <!-- 回复区 -->
        <div
          v-if="comment.replies && comment.replies.length"
          class="ml-4 mt-1 flex flex-col gap-1"
        >
          <div
            v-for="reply in comment.replies"
            :key="reply.id"
            class="bg-white/60 dark:bg-white/10 rounded-lg p-2 border border-gray-200/40 dark:border-white/10"
          >
            <div class="flex gap-1 items-center">
              <img
                v-if="reply.avatar"
                :src="reply.avatar"
                alt="avatar"
                class="w-6 h-6 rounded-full object-cover"
              />
              <span
                class="font-semibold text-gray-800 dark:text-gray-200 text-xs"
                >{{ reply.nickname }}</span
              >
              <a
                v-if="reply.website"
                :href="normalizeWebsite(reply.website)"
                target="_blank"
                rel="noopener"
                class="text-xs text-blue-400 hover:underline ml-1"
                >网站</a
              >
            </div>
            <div class="text-gray-600 dark:text-gray-400 text-xs">
              {{ reply.content }}
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500">
              {{ formatDate(reply.createdAt) }}
            </div>
          </div>
        </div>
        <!-- 回复按钮（可扩展） -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface CommentItem {
  id: string;
  nickname: string;
  email: string;
  website?: string;
  avatar?: string;
  content: string;
  createdAt: string;
  replies?: CommentItem[];
}

const form = ref({ nickname: "", email: "", website: "", content: "" });
const submitting = ref(false);
const loading = ref(false);
const comments = ref<CommentItem[]>([]);

function onSubmit() {
  if (!form.value.nickname || !form.value.email || !form.value.content) return;
  submitting.value = true;
  setTimeout(() => {
    // 模拟添加评论
    comments.value.unshift({
      id: Date.now().toString(),
      nickname: form.value.nickname,
      email: form.value.email,
      website: form.value.website,
      avatar: "",
      content: form.value.content,
      createdAt: new Date().toISOString(),
      replies: [],
    });
    form.value.content = "";
    submitting.value = false;
  }, 600);
}

function normalizeWebsite(url: string) {
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
}

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
