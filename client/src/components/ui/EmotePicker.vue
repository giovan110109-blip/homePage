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

    <RecycleScroller
      ref="scrollerRef"
      class="emote-grid"
      :items="filteredEmotes"
      :item-size="100"
      key-field="name"
      :grid-items="gridCols"
      :buffer="200"
    >
      <template #default="{ item }">
        <div class="emote-item" @click="selectEmote(item)">
          <img
            :src="item.url"
            :alt="item.name"
            loading="lazy"
            class="emote-image"
          />
        </div>
      </template>
    </RecycleScroller>

    <div v-if="filteredEmotes.length === 0" class="emote-empty">
      没有找到表情包
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { useEmotes } from "@/composables/useEmotes";
import type { EmoteItem } from "@/types/emote";

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

const scrollerRef = ref<InstanceType<typeof RecycleScroller> | null>(null);
const gridCols = ref(6);

const updateGridCols = () => {
  const width = window.innerWidth;
  if (width < 480) gridCols.value = 4;
  else if (width < 640) gridCols.value = 5;
  else gridCols.value = 6;
};

const setActiveGroup = (groupName: string) => {
  setActiveGroupOriginal(groupName);
  nextTick(() => {
    scrollerRef.value?.scrollToItem(0);
  });
};

const selectEmote = (emote: EmoteItem) => {
  if (props.disabled) return;
  emit("select", emote.name);
  emit("update:modelValue", emote.name);
};

onMounted(() => {
  updateGridCols();
  window.addEventListener("resize", updateGridCols);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateGridCols);
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
  padding: 16px;
  height: 450px;
  flex: 1;
  min-height: 0;
}

.emote-item {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
  padding: 8px;
  margin: 4px;
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
    padding: 12px;
    height: calc(70vh - 80px);
  }

  .emote-groups {
    padding: 10px 12px;
  }

  .emote-group-tab {
    padding: 5px 12px;
    font-size: 13px;
  }

  .emote-item {
    width: 60px;
    height: 60px;
  }
}
</style>
