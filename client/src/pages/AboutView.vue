<script setup lang="ts">
import { Bike, Code, Gamepad2, Music } from "lucide-vue-next";
import AboutMagazineCollage from "@/components/about/AboutMagazineCollage.vue";
import { useSiteInfoStore } from "@/stores/siteInfo";
import weCode from "@/assets/weCode.png";

const siteInfoStore = useSiteInfoStore();

const experiences = [
  {
    id: 1,
    position: "小程序",
    company: "小程序初版发布🎉",
    period: "2026.2",
    description: "画廊展示待优化，livephoto 待开发。",
    images: [weCode],
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

const interests = [
  { name: "编程", icon: Code },
  { name: "音乐", icon: Music },
  { name: "游戏", icon: Gamepad2 },
  { name: "骑行", icon: Bike },
];

const skillTree = [
  {
    title: "前端界面",
    signal: "UI",
    skills: [
      { name: "Vue / Vite", level: 90 },
      { name: "TypeScript", level: 84 },
      { name: "交互动效", level: 78 },
    ],
  },
  {
    title: "服务与部署",
    signal: "OPS",
    skills: [
      { name: "Node / API", level: 80 },
      { name: "Docker / Nginx", level: 76 },
      { name: "数据与缓存", level: 72 },
    ],
  },
  {
    title: "视觉表达",
    signal: "ART",
    skills: [
      { name: "版式设计", level: 82 },
      { name: "影像叙事", level: 74 },
      { name: "主题系统", level: 86 },
    ],
  },
  {
    title: "AI 工作流",
    signal: "AI",
    skills: [
      { name: "提示词协作", level: 84 },
      { name: "代码辅助", level: 88 },
      { name: "创意原型", level: 80 },
    ],
  },
];

const showPreview = shallowRef(false);
const previewImages = ref<string[]>([]);
const previewInitialIndex = shallowRef(0);

const handleImagePreview = (images: string[], index: number) => {
  previewImages.value = images;
  previewInitialIndex.value = index;
  showPreview.value = true;
};
</script>

<template>
  <div class="theme-page about-page">
    <AboutMagazineCollage
      :info="siteInfoStore.info"
      :experiences="experiences"
      :interests="interests"
      :skill-tree="skillTree"
      @preview="handleImagePreview"
    />

    <el-image-viewer
      v-if="showPreview"
      teleported
      :z-index="4000"
      :url-list="previewImages"
      :initial-index="previewInitialIndex"
      @close="showPreview = false"
    />
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
}
</style>
