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
      @paste="handlePaste"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
    ></div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { useEmotes } from "@/composables/useEmotes";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  customClass?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const { getEmoteUrl } = useEmotes();

const editorRef = ref<HTMLDivElement | null>(null);
const isComposing = ref(false);

const renderEmotesInEditor = () => {
  if (!editorRef.value || isComposing.value) return;

  const childNodes = Array.from(editorRef.value.childNodes);

  childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const emotePattern = /\{\{([^}]+)\}\}/g;
      let match;
      let lastIndex = 0;
      const fragments: (Text | HTMLElement)[] = [];

      while ((match = emotePattern.exec(text)) !== null) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          fragments.push(document.createTextNode(beforeText));
        }

        const emoteName = match[1];
        const emoteUrl = getEmoteUrl(emoteName);
        if (emoteUrl) {
          const img = document.createElement("img");
          img.src = emoteUrl;
          img.alt = emoteName;
          img.className = "inline-emote";
          img.setAttribute("data-emote-name", emoteName);
          img.style.width = "48px";
          img.style.height = "48px";
          img.style.verticalAlign = "middle";
          img.style.display = "inline-block";
          img.style.margin = "0 2px";
          img.contentEditable = "false";
          fragments.push(img);
        } else {
          fragments.push(document.createTextNode(match[0]));
        }

        lastIndex = emotePattern.lastIndex || 0;
      }

      if (lastIndex < text.length) {
        fragments.push(document.createTextNode(text.slice(lastIndex)));
      }

      if (fragments.length > 0) {
        const parent = node.parentNode;
        if (parent) {
          fragments.forEach((fragment) => {
            parent.insertBefore(fragment, node);
          });
          parent.removeChild(node);
        }
      }
    }
  });
};

const getRawText = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    if (element.classList.contains("inline-emote")) {
      const emoteName = element.getAttribute("data-emote-name");
      return emoteName ? `{{${emoteName}}}` : "";
    }

    let result = "";
    for (const child of Array.from(node.childNodes)) {
      result += getRawText(child);
    }
    return result;
  }

  return "";
};

const getTextContent = () => {
  if (!editorRef.value) return "";
  return getRawText(editorRef.value);
};

const setTextContent = (text: string) => {
  if (!editorRef.value) return;
  editorRef.value.innerHTML = text;
  nextTick(() => {
    renderEmotesInEditor();
  });
};

const handleInput = () => {
  if (isComposing.value) return;
  nextTick(() => {
    renderEmotesInEditor();
    emit("update:modelValue", getTextContent());
  });
};

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
};

const handleCompositionStart = () => {
  isComposing.value = true;
};

const handleCompositionEnd = () => {
  isComposing.value = false;
  nextTick(() => {
    renderEmotesInEditor();
    emit("update:modelValue", getTextContent());
  });
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
  }
};

const insertEmote = (emoteName: string, emoteUrl: string) => {
  if (!editorRef.value) return;

  const img = document.createElement("img");
  img.src = emoteUrl;
  img.alt = emoteName;
  img.className = "inline-emote";
  img.setAttribute("data-emote-name", emoteName);
  img.style.width = "48px";
  img.style.height = "48px";
  img.style.verticalAlign = "middle";
  img.style.display = "inline-block";
  img.style.margin = "0 2px";
  img.contentEditable = "false";

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    if (editorRef.value.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(img);

      const space = document.createTextNode("\u00A0");
      range.setStartAfter(img);
      range.insertNode(space);
      range.setStartAfter(space);
      range.setEndAfter(space);

      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.value.appendChild(img);
      editorRef.value.appendChild(document.createTextNode("\u00A0"));
    }
  } else {
    editorRef.value.appendChild(img);
    editorRef.value.appendChild(document.createTextNode("\u00A0"));
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
      setTextContent(newValue || "");
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

.dark .rich-editor {
  background: #1f2937;
  border-color: #4b5563;
  color: #e5e7eb;
}

.dark .rich-editor:focus {
  border-color: #3b82f6;
}

.dark .rich-editor:empty:before {
  color: #6b7280;
}
</style>

<style>
.rich-editor[class] {
  width: 100% !important;
  min-height: 80px !important;
}
</style>
