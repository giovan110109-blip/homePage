<template>
  <RichEditor
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :show-character-count="showCharacterCount"
    :max-height="maxHeight || (height ? `${height}px` : '500px')"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  />
</template>

<script setup lang="ts">
import RichEditor from "./RichEditor.vue";

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    showCharacterCount?: boolean;
    maxHeight?: string;
    height?: number;
  }>(),
  {
    modelValue: "",
    placeholder: "开始输入内容...",
    disabled: false,
    showCharacterCount: true,
    maxHeight: "",
    height: 0,
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();
</script>
