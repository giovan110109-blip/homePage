<template>
  <div
    class="theme-page min-h-screen relative"
  >
    <!-- Background blur effects -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl"
      ></div>
      <div
        class="hidden absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300/10 dark:bg-pink-500/5 rounded-full blur-3xl"
      ></div>
    </div>

    <!-- Content overlay -->
    <div class="relative z-10">
      <!-- Hero Section -->
      <section class="py-20 relative">
        <div class="absolute inset-0 backdrop-blur-sm"></div>
        <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </section>

      <!-- Main Content -->
      <section class="pb-20 relative">
        <div class="absolute inset-0backdrop-blur-sm"></div>
        <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <!-- Profile Image -->
            <div class="lg:col-span-1">
              <div class="sticky top-8">
                <div class="text-center animate-fade-in-up">
                  <img
                    :src="siteInfoStore.info.avatar"
                    :alt="siteInfoStore.info.name"
                    class="w-32 h-32 rounded-full mx-auto object-cover mb-4"
                  />
                  <h2
                    class="text-lg font-medium text-gray-900 dark:text-white mb-1"
                  >
                    {{ siteInfoStore.info.name }}
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {{ siteInfoStore.info.title }}
                  </p>

                  <div
                    class="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm mb-6"
                  >
                    <MapPin class="w-3 h-3 mr-1" />
                    {{ siteInfoStore.info.location }}
                  </div>
                </div>
                <IconCloud
                  :images="imageUrls"
                  class="w-full max-w-[260px] sm:max-w-[300px] mx-auto my-6 block"
                />
              </div>
            </div>
            <!-- Content -->
            <div class="lg:col-span-3 space-y-12">
              <!-- Bio Section -->
              <div
                class="relative animate-fade-in-up bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10 shadow-2xl hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all"
                :ref="(el) => (aboutCardRefs[0] = el as HTMLElement)"
                @mousemove="(event) => handleAboutCardMouseMove(event, 0)"
                @mouseleave="() => handleAboutCardMouseLeave(0)"
              >
                <!-- 鼠标跟随效果 -->
                <div
                  v-if="aboutCardEffects[0]?.show"
                  class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
                  :style="{
                    left: aboutCardEffects[0]?.x - 80 + 'px',
                    top: aboutCardEffects[0]?.y - 80 + 'px',
                    background:
                      'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.3) 30%, rgba(59, 130, 246, 0.15) 60%, transparent 90%)',
                    boxShadow:
                      '0 0 80px rgba(59, 130, 246, 0.5), 0 0 160px rgba(59, 130, 246, 0.3)',
                  }"
                ></div>
                <SparklesText
                  text="关于我"
                  :colors="{ first: '#9E7AFF', second: '#FE8BBB' }"
                  :class="'relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg'"
                  :sparkles-count="10"
                />
                <div
                  class="relative z-10 text-gray-700 dark:text-gray-200 space-y-4 leading-relaxed"
                >
                  <p class="drop-shadow-sm">
                    {{ siteInfoStore.info.bio }}
                  </p>
                  <p class="drop-shadow-sm">
                    <!-- --占位符-- -->
                  </p>
                </div>
              </div>

              <!-- Experience Timeline -->
              <div
                class="relative animate-fade-in-up bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10 shadow-2xl hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all"
                :ref="(el) => (aboutCardRefs[1] = el as HTMLElement)"
                @mousemove="(event) => handleAboutCardMouseMove(event, 1)"
                @mouseleave="() => handleAboutCardMouseLeave(1)"
              >
                <!-- 鼠标跟随效果 -->
                <div
                  v-if="aboutCardEffects[1]?.show"
                  class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
                  :style="{
                    left: aboutCardEffects[1]?.x - 80 + 'px',
                    top: aboutCardEffects[1]?.y - 80 + 'px',
                    background:
                      'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.3) 30%, rgba(34, 197, 94, 0.15) 60%, transparent 90%)',
                    boxShadow:
                      '0 0 80px rgba(34, 197, 94, 0.5), 0 0 160px rgba(34, 197, 94, 0.3)',
                  }"
                ></div>
                <!-- <SparklesText
                  text="站点历程"
                  :colors="{ first: '#34d399', second: '#60a5fa' }"
                  :class="'relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg'"
                  :sparkles-count="10"
                /> -->
                <h3
                  class="relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg"
                >
                  站点历程
                </h3>
                <div class="relative z-10 space-y-6">
                  <!-- <div
                    v-for="(experience, index) in experiences"
                    :key="index"
                    class="relative timeline-item rounded-lg p-3 -m-3 transition-all"
                  >
                    <div class="timeline-content">
                      <div class="flex items-start">
                        <div class="flex-shrink-0">
                          <div
                            class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 timeline-dot"
                          ></div>
                        </div>
                        <div class="ml-4">
                          <div class="pb-6">
                            <div
                              class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1"
                            >
                              <h4
                                class="font-medium text-gray-900 dark:text-white drop-shadow-sm"
                              >
                                {{ experience.position }}
                              </h4>
                              <span
                                class="text-sm text-gray-600 dark:text-gray-300 drop-shadow-sm"
                                >{{ experience.period }}</span
                              >
                            </div>
                            <p
                              class="text-gray-700 dark:text-gray-200 text-sm mb-2 drop-shadow-sm"
                            >
                              {{ experience.company }}
                            </p>
                            <p
                              class="text-gray-700 dark:text-gray-200 text-sm leading-relaxed drop-shadow-sm"
                            >
                              {{ experience.description }}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="index < experiences.length - 1"
                        class="absolute left-1 top-4 w-px h-6 bg-gray-200 dark:bg-gray-700 timeline-line"
                      ></div>
                    </div>
                  </div> -->

                  <Timeline :items="experiences">
                    <template
                      v-for="experience in experiences"
                      :key="`${experience.id}template`"
                      #[experience.id]
                    >
                      <div class="timeline-content">
                        <div class="flex items-start">
                          <div class="ml-4 w-full">
                            <div class="pb-6">
                              <div class="flex items-center justify-between mb-1">
                                <div class="flex items-center gap-2 min-w-0">
                                  <h4
                                    class="font-medium text-gray-900 dark:text-white drop-shadow-sm truncate"
                                  >
                                    {{ experience.position }}
                                  </h4>
                                  <el-popover
                                    v-if="experience.images && experience.images.length > 0"
                                    placement="right"
                                    trigger="hover"
                                  >
                                    <template #reference>
                                      <ImageIcon class="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-600 transition-colors flex-shrink-0" />
                                    </template>
                                    <div class="flex">
                                      <img
                                        v-for="(img, imgIndex) in experience.images"
                                        :key="imgIndex"
                                        :src="img"
                                        class="h-36 w-auto rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        @click="handleImagePreview(experience.images, imgIndex)"
                                      />
                                    </div>
                                  </el-popover>
                                </div>
                                <span
                                  class="text-sm text-gray-600 dark:text-gray-300 drop-shadow-sm flex-shrink-0 ml-2"
                                  >{{ experience.period }}</span
                                >
                              </div>
                              <p
                                class="text-gray-700 dark:text-gray-200 text-sm mb-2 drop-shadow-sm"
                              >
                                {{ experience.company }}
                              </p>
                              <p
                                class="text-gray-700 dark:text-gray-200 text-sm leading-relaxed drop-shadow-sm"
                              >
                                {{ experience.description }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Timeline>
                </div>
              </div>

              <!-- Interests -->
              <div
                class="relative animate-fade-in-up bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10 shadow-2xl hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all"
                :ref="(el) => (aboutCardRefs[3] = el as HTMLElement)"
                @mousemove="(event) => handleAboutCardMouseMove(event, 3)"
                @mouseleave="() => handleAboutCardMouseLeave(3)"
              >
                <!-- 鼠标跟随效果 -->
                <div
                  v-if="aboutCardEffects[3]?.show"
                  class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
                  :style="{
                    left: aboutCardEffects[3]?.x - 80 + 'px',
                    top: aboutCardEffects[3]?.y - 80 + 'px',
                    background:
                      'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(236, 72, 153, 0.3) 30%, rgba(236, 72, 153, 0.15) 60%, transparent 90%)',
                    boxShadow:
                      '0 0 80px rgba(236, 72, 153, 0.5), 0 0 160px rgba(236, 72, 153, 0.3)',
                  }"
                ></div>

                <!-- <SparklesText
                  text="兴趣爱好"
                  :colors="{ first: '#ec4899', second: '#f59e42' }"
                  :class="'relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg'"
                  :sparkles-count="10"
                /> -->
                <h3
                  class="relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg"
                >
                  兴趣爱好
                </h3>

                <div class="relative z-10 flex flex-wrap gap-3">
                  <div
                    v-for="interest in interests"
                    :key="interest.name"
                    class="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white cursor-default bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200/30 dark:border-white/10"
                  >
                    <component
                      :is="interest.icon"
                      class="w-4 h-4 drop-shadow-sm"
                    />
                    <span class="text-sm drop-shadow-sm">{{
                      interest.name
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Contact Section -->
              <div
                class="relative animate-fade-in-up bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10 shadow-2xl hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all"
                :ref="(el) => (aboutCardRefs[4] = el as HTMLElement)"
                @mousemove="(event) => handleAboutCardMouseMove(event, 4)"
                @mouseleave="() => handleAboutCardMouseLeave(4)"
              >
                <!-- 鼠标跟随效果 -->
                <div
                  v-if="aboutCardEffects[4]?.show"
                  class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
                  :style="{
                    left: aboutCardEffects[4]?.x - 80 + 'px',
                    top: aboutCardEffects[4]?.y - 80 + 'px',
                    background:
                      'radial-gradient(circle, rgba(245, 101, 101, 0.6) 0%, rgba(245, 101, 101, 0.3) 30%, rgba(245, 101, 101, 0.15) 60%, transparent 90%)',
                    boxShadow:
                      '0 0 80px rgba(245, 101, 101, 0.5), 0 0 160px rgba(245, 101, 101, 0.3)',
                  }"
                ></div>

                <!-- <SparklesText
                  text="联系我"
                  :colors="{ first: '#f56565', second: '#fbbf24' }"
                  :class="'relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg'"
                  :sparkles-count="10"
                /> -->
                <h3
                  class="relative z-10 text-xl font-medium text-gray-900 dark:text-white mb-4 drop-shadow-lg"
                >
                  联系我
                </h3>
                <div class="relative z-10 space-y-3">
                  <div
                    class="flex items-center text-gray-700 dark:text-gray-200"
                  >
                    <Mail class="w-4 h-4 mr-3 drop-shadow-sm" />
                    <a
                      :href="`mailto:${siteInfoStore.info.email}`"
                      class="hover:text-blue-500 dark:hover:text-blue-400 hover:underline drop-shadow-sm"
                    >
                      {{ siteInfoStore.info.email }}
                    </a>
                  </div>
                  <div
                    class="flex items-center text-gray-700 dark:text-gray-200"
                  >
                    <MapPin class="w-4 h-4 mr-3 drop-shadow-sm" />
                    <span class="drop-shadow-sm">{{
                      siteInfoStore.info.location
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showPreview"
      :url-list="previewImages"
      :initial-index="previewInitialIndex"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  MapPin,
  Mail,
  Briefcase,
  GraduationCap,
  Github,
  Linkedin,
  Twitter,
  MessageCircle,
  Code,
  Camera,
  Music,
  Gamepad2,
  Bike,
  Image as ImageIcon,
} from "lucide-vue-next";
import { useSiteInfoStore } from "@/stores/siteInfo";
import weCode from '@/assets/weCode.png'

const aboutCardRefs = ref<HTMLElement[]>([]);
const aboutCardEffects = reactive<
  Record<number, { x: number; y: number; show: boolean }>
>({});

const handleAboutCardMouseMove = (event: MouseEvent, index: number) => {
  const card = aboutCardRefs.value[index];
  if (!card) return;

  const rect = card.getBoundingClientRect();
  aboutCardEffects[index] = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    show: true,
  };
};

const handleAboutCardMouseLeave = (index: number) => {
  if (aboutCardEffects[index]) {
    aboutCardEffects[index].show = false;
  }
};

const siteInfoStore = useSiteInfoStore();

const slugs = [
  "typescript",
  "javascript",
  "dart",
  "java",
  "react",
  "flutter",
  "android",
  "html5",
  "css3",
  "nodedotjs",
  "express",
  "nextdotjs",
  "prisma",
  "amazonaws",
  "postgresql",
  "firebase",
  "nginx",
  "vercel",
  "testinglibrary",
  "jest",
  "cypress",
  "docker",
  "git",
  "jira",
  "github",
  "gitlab",
  "visualstudiocode",
  "androidstudio",
  "sonarqube",
  "figma",
];

const imageUrls = slugs.map(
  (slug) => `https://cdn.simpleicons.org/${slug}/${slug}`,
);
const experiences = [
    {
    id: 1,
    position: "小程序",
    company: "小程序初版发布🎉",
    period: "2026.2",
    description: "画廊展示待优化，livephoto 待开发。",
    images: [weCode]
  },
  {
    id: 2,
    position: "自家服务器硬盘坏掉了",
    company: "导致所有数据丢失😭😭",
    period: "2026.2",
    description: "😭😭",
  },
  {
    id: 3,
    position: "重构个人主页开发中",
    company: "工作较忙 重构较慢",
    period: "2025.1",
    description: "努力重构中",
  },
];

const handleImagePreview = (images: string[], index: number) => {
  previewImages.value = images;
  previewInitialIndex.value = index;
  showPreview.value = true;
};

const showPreview = ref(false);
const previewImages = ref<string[]>([]);
const previewInitialIndex = ref(0);

const interests = [
  { name: "编程", icon: Code },
  { name: "音乐", icon: Music },
  { name: "游戏", icon: Gamepad2 },
  { name: "骑行", icon: Bike },
];

const iconMap = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  "message-circle": MessageCircle,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || MessageCircle;
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-fade-in-delay {
  animation: fadeIn 0.6s ease-out 0.2s both;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.timeline-item {
  animation: fadeInUp 0.6s ease-out;
}

.timeline-item:nth-child(1) {
  animation-delay: 0.1s;
}
.timeline-item:nth-child(2) {
  animation-delay: 0.2s;
}
.timeline-item:nth-child(3) {
  animation-delay: 0.3s;
}
.timeline-item:nth-child(4) {
  animation-delay: 0.4s;
}
.timeline-item:nth-child(5) {
  animation-delay: 0.5s;
}
.timeline-item:nth-child(6) {
  animation-delay: 0.6s;
}

.timeline-line {
  animation: drawLine 0.8s ease-out;
  transform-origin: top;
}

@keyframes drawLine {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}
</style>
