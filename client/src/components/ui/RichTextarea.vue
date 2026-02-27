<template>
  <div class="rich-textarea">
    <div
      ref="editorRef"
      class="rich-editor"
      :class="customClass"
      contenteditable="true"
      :placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
    ></div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  customClass?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);

const getTextContent = () => {
  if (!editorRef.value) return "";
  return editorRef.value.innerHTML;
};

const setTextContent = (html: string) => {
  if (!editorRef.value) return;
  editorRef.value.innerHTML = html;
};

const handleInput = () => {
  emit("update:modelValue", getTextContent());
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
  }
};

const insertEmote = (emoteName: string, emoteUrl: string) => {
  if (!editorRef.value) return;

  editorRef.value.focus();

  const img = document.createElement("img");
  img.src = emoteUrl;
  img.alt = emoteName;
  img.className = "inline-emote";
  img.style.width = "48px";
  img.style.height = "48px";
  img.style.verticalAlign = "middle";
  img.style.display = "inline-block";
  img.setAttribute("data-emote-name", emoteName);

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    if (editorRef.value.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.value.appendChild(img);
      editorRef.value.focus();
    }
  } else {
    editorRef.value.appendChild(img);
    editorRef.value.focus();
  }

  handleInput();
};

const focus = () => {
  editorRef.value?.focus();
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (getTextContent() !== newValue) {
      setTextContent(newValue);
    }
  },
);

onMounted(() => {
  if (props.modelValue) {
    setTextContent(props.modelValue);
  }
});

defineExpose({
  insertEmote,
  focus,
  editorRef,
});
</script>

<style scoped>
.rich-textarea {
  position: relative;
  width: 100%;
}

.rich-editor {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  overflow-y: auto;
  resize: none;
  transition: border-color 0.2s;
}

.rich-editor:focus {
  border-color: #3b82f6;
}

.rich-editor:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.rich-editor :deep(.inline-emote) {
  display: inline-block;
  vertical-align: middle;
  margin: 0 2px;
  cursor: pointer;
  user-select: none;
}

.rich-editor :deep(img) {
  max-width: 100%;
  height: auto;
}

@media (prefers-color-scheme: dark) {
  .rich-editor {
    background: #1f2937;
    border-color: #4b5563;
    color: #e5e7eb;
  }

  .rich-editor:focus {
    border-color: #3b82f6;
  }

  .rich-editor:empty:before {
    color: #6b7280;
  }
}
</style>

<style>
.rich-editor[class] {
  width: 100% !important;
  min-height: 80px !important;
}
</style>
