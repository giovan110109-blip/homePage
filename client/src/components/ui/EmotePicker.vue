<template>
  <div class="emote-picker">
    <div class="emote-groups">
      <button
        v-for="group in emoteGroups"
        :key="group.name"
        :class="['emote-group-tab', { active: activeGroup === group.name }]"
        @click="setActiveGroup(group.name)"
      >
        {{ group.name }}
      </button>
    </div>

    <div ref="gridRef" class="emote-grid" @scroll="handleScroll">
      <div
        v-for="(emote, index) in visibleEmotes"
        :key="emote.name"
        :ref="(el) => setEmoteRef(el, index)"
        class="emote-item"
        @click="selectEmote(emote)"
      >
        <img
          :src="emote.url"
          :alt="emote.name"
          :loading="shouldLazyLoad(emote, index) ? 'lazy' : 'eager'"
          class="emote-image"
        />
      </div>
    </div>

    <div v-if="filteredEmotes.length === 0" class="emote-empty">
      没有找到表情包
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useEmotes } from "@/composables/useEmotes";

const emit = defineEmits<{
  (e: "select", emote: string): void;
  (e: "update:modelValue", value: string): void;
}>();

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const {
  emoteGroups,
  activeGroup,
  filteredEmotes,
  setActiveGroup: setActiveGroupOriginal,
} = useEmotes();

const gridRef = ref<HTMLElement | null>(null);
const emoteRefs = ref<(HTMLElement | null)[]>([]);
const visibleEmotes = ref<any[]>([]);

const VISIBLE_THRESHOLD = 20;

const setActiveGroup = (groupName: string) => {
  setActiveGroupOriginal(groupName);
  nextTick(() => {
    updateVisibleEmotes();
    if (gridRef.value) {
      gridRef.value.scrollTop = 0;
    }
  });
};

const shouldLazyLoad = (emote: any, index: number) => {
  return index >= VISIBLE_THRESHOLD;
};

const setEmoteRef = (el: any, index: number) => {
  if (emoteRefs.value.length <= index) {
    emoteRefs.value.push(el);
  } else {
    emoteRefs.value[index] = el;
  }
};

const updateVisibleEmotes = () => {
  visibleEmotes.value = filteredEmotes.value;
};

const handleScroll = () => {
  updateVisibleEmotes();
};

const selectEmote = (emote: any) => {
  if (props.disabled) return;
  emit("select", emote.name);
  emit("update:modelValue", emote.name);
};

onMounted(() => {
  updateVisibleEmotes();
  if (gridRef.value) {
    gridRef.value.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  if (gridRef.value) {
    gridRef.value.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
.emote-picker {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.dark .emote-picker {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.emote-groups {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.dark .emote-groups {
  border-bottom-color: #334155;
}

.emote-group-tab {
  padding: 6px 16px;
  border: none;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.dark .emote-group-tab {
  background: #334155;
  color: #e5e7eb;
}

.emote-group-tab:hover {
  background: #e5e7eb;
}

.dark .emote-group-tab:hover {
  background: #475569;
}

.emote-group-tab.active {
  background: #3b82f6;
  color: white;
}

.emote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  padding: 16px;
  max-height: 450px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.emote-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
  padding: 8px;
}

.dark .emote-item {
  background: #334155;
}

.emote-item:hover {
  background: #e5e7eb;
  transform: scale(1.08);
}

.dark .emote-item:hover {
  background: #475569;
}

.emote-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.emote-empty {
  padding: 40px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.dark .emote-empty {
  color: #64748b;
}

@media (max-width: 640px) {
  .emote-picker {
    max-width: calc(100vw - 32px);
    max-height: 70vh;
  }

  .emote-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
    padding: 12px;
    max-height: calc(70vh - 80px);
  }

  .emote-groups {
    padding: 10px 12px;
  }

  .emote-group-tab {
    padding: 5px 12px;
    font-size: 13px;
  }
}
</style>
