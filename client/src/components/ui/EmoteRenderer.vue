<template>
  <div class="emote-renderer" v-html="renderedHtml" @click="handleClick"></div>

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showPreview" class="emote-preview-overlay" @click="closePreview">
        <div class="emote-preview-modal">
          <img :src="previewUrl" :alt="previewName" class="emote-preview-image" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useEmotes } from "@/composables/useEmotes";

const props = withDefaults(
  defineProps<{
    text: string;
    size?: number;
  }>(),
  {
    size: 64,
  },
);

const { getEmoteUrl } = useEmotes();

const showPreview = ref(false);
const previewUrl = ref("");
const previewName = ref("");

const renderedHtml = computed(() => {
  if (!props.text) return "";

  let html = props.text;

  const emotePattern = /\{\{([^}]+)\}\}/g;
  html = html.replace(emotePattern, (match, emoteName) => {
    const emoteUrl = getEmoteUrl(emoteName);
    if (emoteUrl) {
      return `<img src="${emoteUrl}" alt="${emoteName}" class="inline-emote" data-emote-name="${emoteName}" style="width: ${props.size}px; height: ${props.size}px; vertical-align: middle; display: inline-block; margin: 0 2px;" />`;
    }
    console.warn("Emote not found:", emoteName);
    return match;
  });

  return html;
});

const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.classList.contains("inline-emote")) {
    const emoteName = target.getAttribute("data-emote-name");
    const src = target.getAttribute("src");
    if (emoteName && src) {
      previewUrl.value = src;
      previewName.value = emoteName;
      showPreview.value = true;
    }
  }
};

const closePreview = () => {
  showPreview.value = false;
};
</script>

<style scoped>
.emote-renderer {
  display: inline;
  word-wrap: break-word;
}

.emote-renderer :deep(.inline-emote) {
  display: inline-block;
  vertical-align: middle;
  margin: 0 2px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s;
}

.emote-renderer :deep(.inline-emote:hover) {
  transform: scale(1.1);
}

.emote-renderer :deep(img) {
  max-width: 100%;
  height: auto;
}

.emote-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
}

.emote-preview-modal {
  background: white;
  border-radius: 16px;
  padding: 20px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.dark .emote-preview-modal {
  background: #1e293b;
}

.emote-preview-image {
  max-width: 350px;
  max-height: 350px;
  object-fit: contain;
  border-radius: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .emote-preview-image {
    max-width: 250px;
    max-height: 250px;
  }
}
</style>
