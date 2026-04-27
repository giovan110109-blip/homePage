<script setup lang="ts">
import {
  CircleHelp,
  Copy,
  Download,
  Facebook,
  Image,
  ImageOff,
  Linkedin,
  LoaderCircle,
  MessageCircle,
  Send,
  Share2,
  Twitter,
  X,
  type LucideIcon,
} from "lucide-vue-next";

const props = defineProps<{
  name: string;
}>();

const iconMap: Record<string, LucideIcon> = {
  "tabler:copy": Copy,
  "tabler:download": Download,
  "tabler:loader-2": LoaderCircle,
  "tabler:photo": Image,
  "tabler:photo-off": ImageOff,
  "tabler:share-2": Share2,
  "tabler:share-3": Share2,
  "tabler:x": X,
  "tabler:brand-facebook": Facebook,
  "tabler:brand-linkedin": Linkedin,
  "tabler:brand-telegram": Send,
  "tabler:brand-twitter": Twitter,
  "tabler:brand-whatsapp": MessageCircle,
  "tabler:brand-weibo": MessageCircle,
};

const iconComponent = computed(() => iconMap[props.name] ?? CircleHelp);
</script>

<template>
  <component :is="iconComponent" aria-hidden="true" />
</template>
