<template>
  <div class="emote-picker">
    <!-- <div class="emote-picker-header">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索表情包..."
        class="emote-search-input"
      />
    </div> -->

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

    <div class="emote-grid">
      <div
        v-for="emote in filteredEmotes"
        :key="emote.name"
        class="emote-item"
        @click="selectEmote(emote)"
      >
        <img
          :src="emote.url"
          :alt="emote.name"
          loading="lazy"
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
import { useEmotes } from '@/composables/useEmotes'

const emit = defineEmits<{
  (e: 'select', emote: string): void
  (e: 'update:modelValue', value: string): void
}>()

const props = withDefaults(defineProps<{
  modelValue?: string
  disabled?: boolean
}>(), {
  disabled: false
})

const {
  emoteGroups,
  activeGroup,
  filteredEmotes,
  setActiveGroup
} = useEmotes()

const selectEmote = (emote: any) => {
  if (props.disabled) return
  emit('select', emote.name)
  emit('update:modelValue', emote.name)
}
</script>

<style scoped>
.emote-picker {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  z-index: 9999;
}

.emote-picker-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.emote-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.emote-search-input:focus {
  border-color: #3b82f6;
}

.emote-groups {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.emote-group-tab {
  padding: 6px 16px;
  border: none;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.emote-group-tab:hover {
  background: #e5e7eb;
}

.emote-group-tab.active {
  background: #3b82f6;
  color: white;
}

.emote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
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
  padding: 6px;
}

.emote-item:hover {
  background: #e5e7eb;
  transform: scale(1.05);
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

@media (max-width: 640px) {
  .emote-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
    padding: 12px;
  }

  .emote-picker {
    max-width: 100%;
  }
}
</style>
