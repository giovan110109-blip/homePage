<script setup lang="ts">
import Icon from "@/components/ui/Icon.vue";

const props = withDefaults(
  defineProps<{
    block?: boolean;
    color?: "neutral" | "info";
    icon?: string;
    size?: "xs" | "sm" | "lg";
    variant?: "ghost" | "soft";
  }>(),
  {
    block: false,
    color: "neutral",
    icon: undefined,
    size: "sm",
    variant: "ghost",
  },
);

const sizeClass = computed(() => {
  const classes = {
    xs: "min-h-7 px-2 py-1 text-xs",
    sm: "min-h-8 px-2.5 py-1.5 text-sm",
    lg: "min-h-10 px-4 py-2 text-sm",
  };

  return classes[props.size];
});

const toneClass = computed(() => {
  if (props.variant === "soft" && props.color === "info") {
    return "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300";
  }

  if (props.variant === "soft") {
    return "bg-neutral-500/10 text-neutral-800 hover:bg-neutral-500/20 dark:text-neutral-200";
  }

  return "text-neutral-700 hover:bg-neutral-500/10 dark:text-neutral-200 dark:hover:bg-white/10";
});
</script>

<template>
  <button
    type="button"
    :class="[
      'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
      block ? 'w-full' : '',
      sizeClass,
      toneClass,
    ]"
  >
    <Icon
      v-if="icon"
      :name="icon"
      class="size-4 shrink-0"
    />
    <slot />
  </button>
</template>
