<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span
          class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          >FRIEND LINKS</span
        >
        <h1
          class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight"
        >
          朋友圈
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          欢迎交换友情链接，一起分享精彩内容 🔗。
        </p>
      </div>

      <!-- 友情链接展示区域 -->
      <div class="mb-14 sm:mb-20">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
          <Loading />
        </div>

        <div v-else-if="friendLinks.length === 0" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">暂无朋友圈</p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          <a
            v-for="link in friendLinks"
            :key="link._id"
            :href="getExternalLinkRedirectUrl(link.url)"
            rel="noopener noreferrer"
            @click="handleLinkClick(link, $event)"
            class="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-blue-400/70 dark:hover:border-blue-400/50"
          >
            <div
              class="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div
                class="absolute -top-16 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-2xl"
              ></div>
            </div>
            <div class="flex items-start space-x-4">
              <!-- 头像 -->
              <div class="flex-shrink-0">
                <img
                  v-if="link.avatar"
                  :src="link.avatar"
                  :alt="link.name"
                  class="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-200/80 dark:ring-gray-700/80 group-hover:ring-blue-400"
                />
                <div
                  v-else
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold"
                >
                  {{ link.name.charAt(0).toUpperCase() }}
                </div>
              </div>

              <!-- 信息 -->
              <div class="flex-1 min-w-0">
                <h3
                  class="font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-blue-500"
                >
                  {{ link.name }}
                </h3>
                <p
                  class="text-sm text-gray-600/90 dark:text-gray-400 mb-2 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
                >
                  {{ link.description }}
                </p>
                <div
                  class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500"
                >
                  <span
                    v-if="link.category"
                    class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full"
                  >
                    {{ getCategoryLabel(link.category) }}
                  </span>
                  <span v-if="link.clicks > 0" class="flex items-center">
                    <Eye class="w-3 h-3 mr-1" />
                    {{ link.clicks }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 外部链接图标 -->
            <div
              class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink
                class="w-4 h-4 text-gray-400 group-hover:text-blue-400"
              />
            </div>
          </a>
        </div>
      </div>

      <!-- 友链申请说明 -->
      <div
        class="max-w-4xl mx-auto mb-12 relative"
        :ref="(el) => (cardRef = el as HTMLElement)"
        @mousemove="handleCardMouseMove"
        @mouseleave="handleCardMouseLeave"
      >
        <!-- 鼠标跟随效果 -->
        <div
          v-if="cardEffect.show"
          class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0 top-0 left-0"
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
          class="relative bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-200/60 dark:border-white/10 shadow-2xl"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            友情连接申请
          </h2>
          <p class="text-gray-700 dark:text-gray-300 leading-7">
            很高兴能与各位优秀的朋友们交流，本友链目前采用<span
              class="text-blue-600 dark:text-blue-400 font-medium"
              >手动添加</span
            >。如需加入友链，请在下方留言，我会在空闲时间统一添加。
          </p>

          <div class="mt-8">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-3"
            >
              友链相关须知
            </h3>
            <ul
              class="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5"
            >
              <li>
                为了友链相关页面组件的一致性和美观性，可能会对部分信息进行格式化处理。
              </li>
              <li>
                本站图片均使用本地域名存储，如需更换头像等信息，请在本页评论中说明。
              </li>
            </ul>
          </div>

          <div class="mt-8">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-3"
            >
              我的友链信息
            </h3>
            <ul
              class="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5"
            >
              <li>名称：Giovan</li>
              <li>描述：万事顺意</li>
              <li>地址：www.giovan.cn</li>
              <li>
                头像：https://serve.giovan.cn/uploads/1769860396165-143ef0bb240aa25d.jpeg
              </li>
              <li>
                站点图片：https://serve.giovan.cn/uploads/1769860396165-143ef0bb240aa25d.jpeg
              </li>
              <!-- <li>订阅：https://example.com/rss.xml</li> -->
            </ul>
          </div>

          <!-- <div class="mt-8">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-3"
            >
              YAML 示例
            </h3>
            <pre
              class="bg-gray-50/80 dark:bg-black/30 border border-gray-200/60 dark:border-white/10 rounded-2xl p-4 text-xs text-gray-700 dark:text-gray-300 overflow-auto"
            >
name: 你的站点名称
desc: 站点简介
url: https://example.com/
avatar: https://example.com/avatar.png
screenshot: https://example.com/cover.png
rss: https://example.com/rss.xml
            </pre>
          </div> -->

          <div class="mt-8 text-sm text-gray-700 dark:text-gray-300">
            <p>申请需满足：</p>
            <ul class="space-y-2 list-disc pl-5 mt-2">
              <li>内容合法合规，站点可正常访问。</li>
              <li>优先收录原创、技术、生活类博客。</li>
              <li>请先添加本站友链，审核通过后互链生效。</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 申请友情链接表单 -->
      <div
        class="max-w-2xl mx-auto relative"
        :ref="(el) => (formCardRef = el as HTMLElement)"
        @mousemove="handleFormCardMouseMove"
        @mouseleave="handleFormCardMouseLeave"
      >
        <!-- 鼠标跟随效果 -->
        <div
          v-if="formCardEffect.show"
          class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
          :style="{
            left: formCardEffect.x - 80 + 'px',
            top: formCardEffect.y - 80 + 'px',
            background:
              'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.3) 30%, rgba(34, 197, 94, 0.15) 60%, transparent 90%)',
            boxShadow:
              '0 0 80px rgba(34, 197, 94, 0.5), 0 0 160px rgba(34, 197, 94, 0.3)',
          }"
        ></div>
        <div
          class="relative bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-200/60 dark:border-white/10 shadow-2xl"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            申请友情链接
          </h2>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="您的网站名称"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站链接 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.url"
                type="url"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站描述 <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="form.description"
                required
                rows="3"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="简短介绍您的网站（建议 50 字以内）"
              ></textarea>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站头像/Logo URL
              </label>
              <input
                v-model="form.avatar"
                type="url"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                联系邮箱 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                RSS 订阅地址（可选）
              </label>
              <input
                v-model="form.rss"
                type="url"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/rss.xml"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站分类
              </label>
              <select
                v-model="form.category"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="tech">技术博客</option>
                <option value="design">设计</option>
                <option value="life">生活</option>
                <option value="tools">工具</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="flex items-center justify-end space-x-4">
              <AppButton variant="reset" nativeType="button" @click="resetForm">
                重置
              </AppButton>
              <AppButton
                variant="primary"
                nativeType="submit"
                :loading="submitting"
                :disabled="submitting"
              >
                {{ submitting ? "提交中..." : "提交申请" }}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Eye, ExternalLink } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import Loading from "@/components/ui/Loading.vue";
import {
  getFriendLinks,
  applyFriendLink,
  recordFriendLinkClick,
} from "@/api/friendLink";
import type { FriendLink, FriendLinkFormData } from "@/types/api";
import { getExternalLinkRedirectUrl } from "@/utils/external-link";

const loading = ref(false);
const submitting = ref(false);
const friendLinks = ref<FriendLink[]>([]);

const getCategoryLabel = (category?: string) => {
  const map: Record<string, string> = {
    tech: "技术博客",
    design: "设计",
    life: "生活",
    tools: "工具",
    other: "其他",
  };
  return map[category || ""] || category || "";
};

const form = ref<FriendLinkFormData>({
  name: "",
  url: "",
  description: "",
  avatar: "",
  email: "",
  rss: "",
  category: "tech",
});

// 加载友情链接
const loadFriendLinks = async () => {
  loading.value = true;
  try {
    const res = await getFriendLinks();
    friendLinks.value = res.data || [];
  } catch (error: any) {
    ElMessage.error(error.message || "加载失败");
  } finally {
    loading.value = false;
  }
};

// 记录点击
const handleLinkClick = async (link: FriendLink, event: MouseEvent) => {
  // 阻止默认跳转
  event.preventDefault();

  // 记录点击数
  const index = friendLinks.value.findIndex((item) => item._id === link._id);
  if (index > -1) {
    const current = friendLinks.value[index].clicks || 0;
    friendLinks.value[index].clicks = current + 1;
  }
  try {
    await recordFriendLinkClick(link._id);
  } catch (error) {
    if (index > -1) {
      const current = friendLinks.value[index].clicks || 1;
      friendLinks.value[index].clicks = Math.max(0, current - 1);
    }
  }

  // 跳转到外链确认页面
  if (link.url) {
    window.location.href = getExternalLinkRedirectUrl(link.url);
  }
};

// 提交申请
const handleSubmit = async () => {
  submitting.value = true;
  try {
    await applyFriendLink(form.value);
    ElMessage.success("申请已提交，请耐心等待审核");
    resetForm();
    // 可选：刷新列表
    // await loadFriendLinks()
  } catch (error: any) {
    ElMessage.error(error.message || "提交失败");
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.value = {
    name: "",
    url: "",
    description: "",
    avatar: "",
    email: "",
    rss: "",
    category: "tech",
  };
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

const formCardRef = ref<HTMLElement | null>(null);
const formCardEffect = reactive<{ x: number; y: number; show: boolean }>({
  x: 0,
  y: 0,
  show: false,
});
const handleFormCardMouseMove = (event: MouseEvent) => {
  if (!formCardRef.value) return;
  const rect = formCardRef.value.getBoundingClientRect();
  formCardEffect.x = event.clientX - rect.left;
  formCardEffect.y = event.clientY - rect.top;
  formCardEffect.show = true;
};

const handleFormCardMouseLeave = () => {
  formCardEffect.show = false;
};

onMounted(() => {
  loadFriendLinks();
});
</script>
