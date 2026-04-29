<template>
  <button
    :type="nativeType"
    :disabled="disabled || loading"
    :class="buttonClass"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'reset' | 'submit' | 'check' | 'ghost-danger' | 'custom' | 'link-primary' | 'link-danger' | 'outline' | 'danger' | 'success'
  size?: 'lg' | 'md' | 'sm' | 'xs' | 'none'
  nativeType?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  nativeType: 'button',
  disabled: false,
  loading: false
})

defineEmits<{
  click: []
}>()

const buttonClass = computed(() => {
  const base = 'app-button inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none'
  const sizeMap: Record<string, string> = {
    lg: 'px-8 py-4 text-base',
    md: 'px-6 py-3 text-sm',
    sm: 'px-4 py-2 text-sm',
    xs: 'px-3 py-1.5 text-xs',
    none: ''
  }
  const variants: Record<string, string> = {
    primary: 'app-button--primary',
    secondary: 'app-button--secondary',
    ghost: 'app-button--ghost',
    submit: 'app-button--primary',
    success: 'app-button--success',
    danger: 'app-button--danger',
    reset: 'app-button--secondary',
    check: 'app-button--check',
    'ghost-danger': 'app-button--ghost-danger p-1',
    'link-primary': 'app-button--link-primary ml-2 px-0 py-0',
    'link-danger': 'app-button--link-danger ml-2 px-0 py-0',
    outline: 'app-button--outline',
    custom: ''
  }
  return [base, sizeMap[props.size], variants[props.variant]]
})
</script>

<style scoped>
.app-button {
  border-color: var(--theme-border);
  color: var(--theme-text-primary);
}

.app-button:focus-visible {
  box-shadow: 0 0 0 4px var(--theme-accent-soft);
}

.app-button--primary {
  border-color: transparent;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme-accent-strong) 88%, white 12%),
      var(--theme-accent)
    );
  color: white;
  box-shadow: 0 14px 32px color-mix(in srgb, var(--theme-accent) 34%, transparent);
}

.app-button--primary:not(:disabled):hover {
  background:
    linear-gradient(
      135deg,
      var(--theme-accent-strong),
      color-mix(in srgb, var(--theme-accent) 84%, black 16%)
    );
  transform: translateY(-1px);
}

.app-button--secondary,
.app-button--outline {
  background: var(--theme-surface-soft);
  border-color: var(--theme-border);
  color: var(--theme-text-secondary);
  box-shadow: var(--theme-shadow-sm);
}

.app-button--secondary:not(:disabled):hover,
.app-button--outline:not(:disabled):hover {
  background: var(--theme-surface-strong);
  border-color: var(--theme-border-strong);
  color: var(--theme-text-primary);
}

.app-button--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--theme-text-secondary);
}

.app-button--ghost:not(:disabled):hover {
  background: var(--theme-accent-soft);
  color: var(--theme-text-primary);
}

.app-button--check {
  background: var(--theme-accent-soft);
  border-color: color-mix(in srgb, var(--theme-accent) 30%, transparent);
  color: var(--theme-accent);
}

.app-button--check:not(:disabled):hover {
  background: color-mix(in srgb, var(--theme-accent-soft) 78%, var(--theme-surface));
  border-color: var(--theme-accent);
  color: var(--theme-accent-strong);
}

.app-button--success {
  background: #059669;
  border-color: transparent;
  color: white;
  box-shadow: 0 14px 32px rgba(5, 150, 105, 0.24);
}

.app-button--success:not(:disabled):hover {
  background: #047857;
}

.app-button--danger {
  background: #dc2626;
  border-color: transparent;
  color: white;
  box-shadow: 0 14px 32px rgba(220, 38, 38, 0.22);
}

.app-button--danger:not(:disabled):hover {
  background: #b91c1c;
}

.app-button--ghost-danger {
  background: transparent;
  border-color: transparent;
  color: var(--theme-text-muted);
  box-shadow: none;
}

.app-button--ghost-danger:not(:disabled):hover {
  background: var(--theme-danger-soft);
  color: #ef4444;
}

.app-button--link-primary,
.app-button--link-danger {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.app-button--link-primary {
  color: var(--theme-accent);
}

.app-button--link-primary:not(:disabled):hover {
  color: var(--theme-accent-strong);
}

.app-button--link-danger {
  color: #ef4444;
}

.app-button--link-danger:not(:disabled):hover {
  color: #dc2626;
}

:global(:root.dark) .app-button--success {
  background: #34d399;
  color: white;
}

:global(:root.dark) .app-button--success:not(:disabled):hover {
  background: #6ee7b7;
}

:global(:root.dark) .app-button--danger {
  background: #f87171;
  color: white;
}

:global(:root.dark) .app-button--danger:not(:disabled):hover {
  background: #fca5a5;
}
</style>
