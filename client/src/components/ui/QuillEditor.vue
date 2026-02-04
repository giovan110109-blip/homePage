<template>
    <mavon-editor
      v-model="markdownValue"
      :placeholder="placeholder"
      :editable="!disabled && !readOnly"
      :subfield="true"
      :defaultOpen="'both'"
      :toolbarsFlag="true"
      :ishljs="true"
      @change="handleChange"
    />
</template>

<script setup lang="ts">
import markdownit from 'markdown-it'
import hljs from 'highlight.js'

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

const markdownValue = ref(props.modelValue || '')


const md = markdownit({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
 
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

const handleChange = (value: string) => {
  emit('update:modelValue', value || '')
}
</script>

<style scoped>
.mavon-editor-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
}

.mavon-editor-wrapper :deep(.v-note-op) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.mavon-editor-wrapper :deep(.v-note-panel) {
  border: none;
}

.mavon-editor-wrapper :deep(textarea) {
  font-family: inherit;
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
}

.dark .mavon-editor-wrapper {
  background: #1f2937;
  border-color: #4b5563;
}

.dark .mavon-editor-wrapper :deep(.v-note-op) {
  background: #111827;
  border-bottom-color: #4b5563;
}

.dark .mavon-editor-wrapper :deep(textarea) {
  color: #f3f4f6;
  background: #1f2937;
}

.mavon-preview {
  margin-top: 16px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.dark .mavon-preview {
  border-color: #374151;
  background: #111827;
}

.mavon-preview :deep(pre) {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow-x: auto;
}
</style>
