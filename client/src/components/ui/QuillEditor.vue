<template>
  <div class="quill-editor-wrapper">
    <div :id="editorId" class="quill-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'

interface Props {
  modelValue?: string
  placeholder?: string
  height?: number
  disabled?: boolean
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '开始输入内容...',
  height: 400,
  disabled: false,
  readOnly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorId = `quill-editor-${Math.random().toString(36).substr(2, 9)}`
let quillEditor: Quill | null = null

watch(() => props.modelValue, (newVal) => {
  if (quillEditor && newVal !== quillEditor.root.innerHTML) {
    quillEditor.root.innerHTML = newVal
  }
})

onMounted(() => {
  quillEditor = new Quill(`#${editorId}`, {
    theme: 'snow',
    placeholder: props.placeholder,
    readOnly: props.disabled || props.readOnly,
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ header: 1 }, { header: 2 }, { header: 3 }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    },
  })

  // 设置初始内容
  if (props.modelValue) {
    quillEditor.root.innerHTML = props.modelValue
  }

  // 监听编辑器变化
  quillEditor.on('text-change', () => {
    const html = quillEditor!.root.innerHTML
    emit('update:modelValue', html)
  })
})

onBeforeUnmount(() => {
  if (quillEditor) {
    quillEditor = null
  }
})
</script>

<style scoped>
.quill-editor-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
}

.quill-editor-wrapper :deep(.ql-toolbar) {
  padding: 12px 8px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-top: none;
  border-left: none;
  border-right: none;
}

.quill-editor-wrapper :deep(.ql-container) {
  font-family: inherit;
  font-size: 15px;
  border: none;
}

.quill-editor-wrapper :deep(.ql-editor) {
  min-height: v-bind('`${height}px`');
  max-height: 600px;
  padding: 16px;
  color: #1f2937;
  line-height: 1.6;
  outline: none;
}

.quill-editor-wrapper :deep(.ql-editor:focus) {
  outline: none;
}

.quill-editor-wrapper :deep(.ql-editor.ql-blank::before) {
  color: #d1d5db;
  font-style: normal;
}

.quill-editor-wrapper :deep(.ql-snow .ql-toolbar button:hover),
.quill-editor-wrapper :deep(.ql-snow .ql-toolbar button:focus),
.quill-editor-wrapper :deep(.ql-snow .ql-toolbar button.ql-active) {
  color: #3b82f6;
}

.quill-editor-wrapper :deep(.ql-toolbar.ql-snow button:hover .ql-stroke),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow button:focus .ql-stroke),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow button.ql-active .ql-stroke) {
  stroke: #3b82f6;
}

.quill-editor-wrapper :deep(.ql-toolbar.ql-snow button:hover .ql-fill),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow button:focus .ql-fill),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow button.ql-active .ql-fill),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow .ql-picker-label:hover),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow .ql-picker-item:hover),
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow .ql-picker-item.ql-selected) {
  color: #3b82f6;
}

.quill-editor-wrapper :deep(.ql-toolbar.ql-snow .ql-picker-options .ql-picker-item.ql-selected) {
  background-color: #3b82f6;
  color: white;
}

/* 编辑器内容样式 */
.quill-editor-wrapper :deep(.ql-editor h1),
.quill-editor-wrapper :deep(.ql-editor h2),
.quill-editor-wrapper :deep(.ql-editor h3),
.quill-editor-wrapper :deep(.ql-editor h4),
.quill-editor-wrapper :deep(.ql-editor h5),
.quill-editor-wrapper :deep(.ql-editor h6) {
  font-weight: 700;
  margin: 0.5em 0;
}

.quill-editor-wrapper :deep(.ql-editor h1) {
  font-size: 28px;
}

.quill-editor-wrapper :deep(.ql-editor h2) {
  font-size: 24px;
}

.quill-editor-wrapper :deep(.ql-editor h3) {
  font-size: 20px;
}

.quill-editor-wrapper :deep(.ql-editor code) {
  background: #f3f4f6;
  color: #1f2937;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 13px;
}

.quill-editor-wrapper :deep(.ql-editor pre) {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  margin: 0.5em 0;
  overflow-x: auto;
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #e5e7eb;
}

.quill-editor-wrapper :deep(.ql-editor blockquote) {
  border-left: 3px solid #3b82f6;
  margin: 0.5em 0;
  padding-left: 12px;
  color: #6b7280;
}

.quill-editor-wrapper :deep(.ql-editor ul),
.quill-editor-wrapper :deep(.ql-editor ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

.quill-editor-wrapper :deep(.ql-editor a) {
  color: #3b82f6;
  text-decoration: underline;
}

.quill-editor-wrapper :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* 深色模式 */
.dark .quill-editor-wrapper {
  background: #1f2937;
  border-color: #4b5563;
}

.dark .quill-editor-wrapper :deep(.ql-toolbar) {
  background: #111827;
  border-bottom-color: #4b5563;
}

.dark .quill-editor-wrapper :deep(.ql-editor) {
  background: #1f2937;
  color: #f3f4f6;
}

.dark .quill-editor-wrapper :deep(.ql-editor.ql-blank::before) {
  color: #6b7280;
}

.dark .quill-editor-wrapper :deep(.ql-editor code),
.dark .quill-editor-wrapper :deep(.ql-editor pre) {
  background: #374151;
  color: #fca5a5;
}

.dark .quill-editor-wrapper :deep(.ql-editor pre) {
  background: #0f172a;
  color: #f3f4f6;
}

.dark .quill-editor-wrapper :deep(.ql-editor blockquote) {
  border-left-color: #60a5fa;
  color: #9ca3af;
}

.dark .quill-editor-wrapper :deep(.ql-editor a) {
  color: #60a5fa;
}
</style>
