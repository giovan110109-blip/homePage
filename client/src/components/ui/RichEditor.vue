<template>
  <div class="rich-editor" :class="{ 'is-disabled': disabled }">
    <div v-if="editor" class="editor-toolbar">
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
          title="粗体 (Ctrl+B)"
        >
          <Bold class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
          title="斜体 (Ctrl+I)"
        >
          <Italic class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()"
          title="下划线 (Ctrl+U)"
        >
          <Underline class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
          title="删除线"
        >
          <Strikethrough class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('code') }"
          @click="editor.chain().focus().toggleCode().run()"
          title="行内代码"
        >
          <CodeIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          title="标题 1"
        >H1</button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          title="标题 2"
        >H2</button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          title="标题 3"
        >H3</button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('heading', { level: 4 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
          title="标题 4"
        >H4</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
          title="无序列表"
        >
          <List class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
          title="有序列表"
        >
          <ListOrdered class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('taskList') }"
          @click="editor.chain().focus().toggleTaskList().run()"
          title="任务列表"
        >
          <CheckSquare class="w-4 h-4" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          @click="toggleCodeBlock"
          title="代码块"
        >
          <Code2 class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
          title="引用"
        >
          <Quote class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
          title="插入表格"
        >
          <Table class="w-4 h-4" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          @click="editor.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          title="左对齐"
        >
          <AlignLeft class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="editor.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          title="居中"
        >
          <AlignCenter class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="editor.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          title="右对齐"
        >
          <AlignRight class="w-4 h-4" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <div class="color-picker-wrapper">
          <button
            type="button"
            class="toolbar-btn"
            title="文字颜色"
          >
            <Palette class="w-4 h-4" />
            <span class="color-indicator" :style="{ backgroundColor: currentTextColor }"></span>
          </button>
          <input
            type="color"
            class="color-picker"
            :value="currentTextColor"
            @input="setTextColor(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="color-picker-wrapper">
          <button
            type="button"
            class="toolbar-btn"
            title="背景高亮"
          >
            <Highlighter class="w-4 h-4" />
            <span class="color-indicator" :style="{ backgroundColor: currentHighlight }"></span>
          </button>
          <input
            type="color"
            class="color-picker"
            :value="currentHighlight"
            @input="setHighlight(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          @click="setLink"
          :class="{ 'is-active': editor.isActive('link') }"
          title="插入链接"
        >
          <Link class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="insertImage"
          title="插入图片"
        >
          <ImageIcon class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="insertImageFromURL"
          title="插入图片URL"
        >
          <ImagePlus class="w-4 h-4" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-btn"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          title="撤销 (Ctrl+Z)"
        >
          <Undo class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          title="重做 (Ctrl+Y)"
        >
          <Redo class="w-4 h-4" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <select
          class="toolbar-select"
          @change="setCodeBlockLanguage(($event.target as HTMLSelectElement).value)"
          title="代码语言"
        >
          <option value="">选择语言</option>
          <option v-for="lang in codeLanguages" :key="lang" :value="lang">{{ lang }}</option>
        </select>
      </div>
    </div>

    <div class="editor-content">
      <EditorContent v-if="editor" :editor="editor" />
    </div>

    <div v-if="showCharacterCount" class="editor-footer">
      <span>{{ characterCount }} 字符 / {{ wordCount }} 词</span>
    </div>

    <div v-if="editor?.isActive('table')" class="table-toolbar">
      <button @click="editor.chain().focus().addColumnBefore().run()">左侧插入列</button>
      <button @click="editor.chain().focus().addColumnAfter().run()">右侧插入列</button>
      <button @click="editor.chain().focus().deleteColumn().run()">删除列</button>
      <button @click="editor.chain().focus().addRowBefore().run()">上方插入行</button>
      <button @click="editor.chain().focus().addRowAfter().run()">下方插入行</button>
      <button @click="editor.chain().focus().deleteRow().run()">删除行</button>
      <button @click="editor.chain().focus().deleteTable().run()">删除表格</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Code } from "@tiptap/extension-code";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { createLowlight, all } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  List,
  ListOrdered,
  CheckSquare,
  Code2,
  Quote,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  ImagePlus,
  Undo,
  Redo,
} from "lucide-vue-next";
import { ElMessage, ElMessageBox } from "element-plus";

import "highlight.js/styles/github-dark.css";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    showCharacterCount?: boolean;
    maxHeight?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "开始输入内容...",
    disabled: false,
    showCharacterCount: true,
    maxHeight: "500px",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const lowlight = createLowlight(all);

const currentTextColor = ref("#000000");
const currentHighlight = ref("#fef08a");

const codeLanguages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "sql",
  "html",
  "css",
  "scss",
  "json",
  "xml",
  "yaml",
  "markdown",
  "bash",
  "shell",
  "dockerfile",
  "nginx",
  "apache",
  "diff",
  "plaintext",
];

const editor = ref<any>(null);

const characterCount = computed(() => editor.value?.storage.characterCount?.characters() ?? 0);
const wordCount = computed(() => editor.value?.storage.characterCount?.words() ?? 0);

editor.value = new Editor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "editor-link",
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: "editor-image",
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    Code,
    CodeBlockLowlight.configure({
      defaultLanguage: "plaintext",
      lowlight,
    }),
    TextStyle,
    Color,
    Typography,
    CharacterCount,
    Gapcursor,
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    emit("update:modelValue", html);
    emit("change", html);
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value);
    }
  }
);

watch(
  () => props.disabled,
  (value) => {
    if (editor.value) {
      editor.value.setEditable(!value);
    }
  }
);

const setTextColor = (color: string) => {
  currentTextColor.value = color;
  editor.value?.chain().focus().setColor(color).run();
};

const setHighlight = (color: string) => {
  currentHighlight.value = color;
  editor.value?.chain().focus().toggleHighlight({ color }).run();
};

const setLink = async () => {
  const previousUrl = editor.value?.getAttributes("link").href;
  const result: any = await ElMessageBox.prompt("请输入链接地址", "插入链接", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputValue: previousUrl || "",
  });

  const url = result.value;
  if (url === null || url === undefined) return;

  if (url === "") {
    editor.value?.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor.value?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
};

const insertImage = async () => {
  const result: any = await ElMessageBox.prompt("请输入图片地址", "插入图片", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  });

  if (result.value) {
    editor.value?.chain().focus().setImage({ src: result.value }).run();
  }
};

const insertImageFromURL = async () => {
  const result: any = await ElMessageBox.prompt("请输入图片地址", "插入图片", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  });

  if (result.value) {
    editor.value?.chain().focus().setImage({ src: result.value }).run();
  }
};

const toggleCodeBlock = () => {
  editor.value?.chain().focus().toggleCodeBlock().run();
};

const setCodeBlockLanguage = (language: string) => {
  if (language) {
    editor.value?.chain().focus().updateAttributes("codeBlock", { language }).run();
  }
};

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.rich-editor {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.dark .rich-editor {
  border-color: #374151;
  background: #1f2937;
}

.rich-editor.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dark .editor-toolbar {
  border-color: #374151;
  background: #111827;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 8px;
}

.dark .toolbar-divider {
  background: #374151;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.dark .toolbar-btn {
  color: #d1d5db;
}

.toolbar-btn:hover {
  background: #e5e7eb;
}

.dark .toolbar-btn:hover {
  background: #374151;
}

.toolbar-btn.is-active {
  background: #dbeafe;
  color: #2563eb;
}

.dark .toolbar-btn.is-active {
  background: #1e3a5f;
  color: #60a5fa;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
}

.dark .toolbar-select {
  border-color: #374151;
  background: #1f2937;
  color: #d1d5db;
}

.color-picker-wrapper {
  position: relative;
}

.color-picker {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  opacity: 0;
  cursor: pointer;
}

.color-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.editor-content {
  padding: 16px;
  min-height: 200px;
  max-height: v-bind(maxHeight);
  overflow-y: auto;
}

.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 150px;
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-content :deep(.tiptap h1) {
  font-size: 2em;
  font-weight: 700;
  margin: 1em 0 0.5em;
}

.editor-content :deep(.tiptap h2) {
  font-size: 1.5em;
  font-weight: 700;
  margin: 1em 0 0.5em;
}

.editor-content :deep(.tiptap h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.editor-content :deep(.tiptap h4) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.editor-content :deep(.tiptap ul),
.editor-content :deep(.tiptap ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.editor-content :deep(.tiptap blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
}

.dark .editor-content :deep(.tiptap blockquote) {
  border-color: #374151;
  color: #9ca3af;
}

.editor-content :deep(.tiptap code) {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 0.2em 0.4em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.dark .editor-content :deep(.tiptap code) {
  background: #374151;
}

.editor-content :deep(.tiptap pre) {
  background: #1f2937;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
}

.editor-content :deep(.tiptap pre code) {
  background: transparent;
  padding: 0;
  color: #e5e7eb;
}

.editor-content :deep(.tiptap pre .hljs-comment),
.editor-content :deep(.tiptap pre .hljs-quote) {
  color: #6b7280;
}

.editor-content :deep(.tiptap pre .hljs-keyword),
.editor-content :deep(.tiptap pre .hljs-selector-tag) {
  color: #f472b6;
}

.editor-content :deep(.tiptap pre .hljs-string),
.editor-content :deep(.tiptap pre .hljs-attr) {
  color: #a5d6ff;
}

.editor-content :deep(.tiptap pre .hljs-number),
.editor-content :deep(.tiptap pre .hljs-literal) {
  color: #79c0ff;
}

.editor-content :deep(.tiptap pre .hljs-function),
.editor-content :deep(.tiptap pre .hljs-title) {
  color: #d2a8ff;
}

.editor-content :deep(.tiptap pre .hljs-variable),
.editor-content :deep(.tiptap pre .hljs-template-variable) {
  color: #ffa657;
}

.editor-content :deep(.tiptap pre .hljs-built_in) {
  color: #7ee787;
}

.editor-content :deep(.tiptap .editor-link) {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

.dark .editor-content :deep(.tiptap .editor-link) {
  color: #60a5fa;
}

.editor-content :deep(.tiptap .editor-image) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li > label) {
  flex-shrink: 0;
  margin-top: 4px;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li > div) {
  flex: 1;
}

.editor-content :deep(.tiptap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  overflow: hidden;
  table-layout: fixed;
}

.editor-content :deep(.tiptap table td),
.editor-content :deep(.tiptap table th) {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  position: relative;
  vertical-align: top;
  box-sizing: border-box;
  min-width: 100px;
}

.dark .editor-content :deep(.tiptap table td),
.dark .editor-content :deep(.tiptap table th) {
  border-color: #374151;
}

.editor-content :deep(.tiptap table th) {
  background: #f9fafb;
  font-weight: 600;
  text-align: left;
}

.dark .editor-content :deep(.tiptap table th) {
  background: #111827;
}

.editor-content :deep(.tiptap table .selectedCell) {
  background: #dbeafe;
}

.dark .editor-content :deep(.tiptap table .selectedCell) {
  background: #1e3a5f;
}

.editor-content :deep(.tiptap mark) {
  border-radius: 2px;
  padding: 0 2px;
}

.editor-footer {
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  text-align: right;
}

.dark .editor-footer {
  border-color: #374151;
  color: #9ca3af;
}

.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dark .table-toolbar {
  border-color: #374151;
  background: #111827;
}

.table-toolbar button {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .table-toolbar button {
  border-color: #374151;
  background: #1f2937;
  color: #d1d5db;
}

.table-toolbar button:hover {
  background: #e5e7eb;
}

.dark .table-toolbar button:hover {
  background: #374151;
}
</style>
