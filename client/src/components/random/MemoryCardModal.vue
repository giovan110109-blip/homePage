<script setup lang="ts">
import { computed } from "vue";
import {
  Camera,
  MapPin,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  Timer,
  X,
} from "lucide-vue-next";
import EmoteRenderer from "@/components/ui/EmoteRenderer.vue";
import { getUploadURL } from "@/utils";

const props = defineProps<{
  modelValue: boolean;
  destination: Record<string, any> | null;
  drawing?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "redraw"): void;
}>();

const memory = computed(() => props.destination?.memory || {});
const normalizeImageUrl = (value: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/uploads")) return getUploadURL(value);
  return value;
};
const imageUrl = computed(() => {
  const value = String(memory.value.imageUrl || memory.value.avatar || "");
  return normalizeImageUrl(value);
});
const label = computed(() => props.destination?.label || "记忆盲盒");
const hasMessage = computed(() => Boolean(memory.value.messageContent));

const normalizeText = (value: unknown) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const isPostalCode = (value: string) => /^\d{5,}$/.test(value.trim());
const splitAddress = (value: string) =>
  normalizeText(value)
    .split(/[，,、]/)
    .map((part) => part.trim())
    .filter((part) => part && !isPostalCode(part));

const isVerboseAddress = (value: string) =>
  splitAddress(value).length >= 4 && normalizeText(value).length > 18;

const compactAddressTitle = (value: string) => {
  if (!isVerboseAddress(value)) return value;
  return splitAddress(value).filter((part) => part !== "中国")[0] || value;
};

const title = computed(() =>
  compactAddressTitle(normalizeText(props.destination?.title || "一段旧时光")),
);
const description = computed(() => {
  const rawDescription = normalizeText(
    props.destination?.description || "抽到了一张还没有写说明的记忆卡。",
  );
  if (!rawDescription) return "";

  const dateText = rawDescription.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (isVerboseAddress(rawDescription) && dateText) return dateText;

  const compactedDescription = compactAddressTitle(rawDescription);
  return compactedDescription === title.value ? "" : compactedDescription;
});

const isDuplicateMeta = (text: string) => {
  const normalized = normalizeText(text);
  return (
    normalized === title.value ||
    (Boolean(description.value) && normalized === description.value)
  );
};

const metaItems = computed(() =>
  [
    memory.value.year && { icon: Timer, text: `${memory.value.year}` },
    memory.value.place && { icon: MapPin, text: memory.value.place },
    memory.value.camera && { icon: Camera, text: memory.value.camera },
  ].filter((item) => {
    if (!item) return false;
    return !isDuplicateMeta(item.text);
  }) as Array<{ icon: any; text: string }>,
);

const close = () => emit("update:modelValue", false);
</script>

<template>
  <Teleport to="body">
    <Transition name="memory-card">
      <div v-if="modelValue" class="memory-card-modal" @click.self="close">
        <section class="memory-card-modal__panel" role="dialog" aria-modal="true">
          <button class="memory-card-modal__close" type="button" aria-label="关闭" @click="close">
            <X class="h-4 w-4" />
          </button>

          <div class="memory-card-modal__visual">
            <img v-if="imageUrl" :src="imageUrl" :alt="title" />
            <div v-else class="memory-card-modal__fallback">
              <Sparkles class="h-10 w-10" />
              <span>{{ label }}</span>
            </div>
          </div>

          <div class="memory-card-modal__body">
            <span class="memory-card-modal__kicker">
              <Sparkles class="h-4 w-4" />
              MEMORY CARD
            </span>
            <h2>{{ title }}</h2>
            <p v-if="description">{{ description }}</p>

            <div v-if="metaItems.length" class="memory-card-modal__meta">
              <span v-for="item in metaItems" :key="item.text">
                <component :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </span>
            </div>

            <blockquote v-if="hasMessage" class="memory-card-modal__message">
              <MessageCircle class="h-4 w-4" />
              <div>
                <strong>{{ memory.messageAuthor || "访客" }}</strong>
                <EmoteRenderer
                  class="memory-card-modal__message-content"
                  :text="memory.messageContent"
                  :size="72"
                />
              </div>
            </blockquote>

            <div v-if="memory.excerpt && !hasMessage" class="memory-card-modal__excerpt">
              {{ memory.excerpt }}
            </div>

            <div class="memory-card-modal__actions">
              <button type="button" class="memory-card-modal__secondary" :disabled="drawing" @click="emit('redraw')">
                <RefreshCcw class="h-4 w-4" />
                {{ drawing ? "抽取中" : "再抽一张" }}
              </button>
              <button type="button" class="memory-card-modal__primary" @click="emit('confirm')">
                去看看
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.memory-card-modal {
  position: fixed;
  inset: 0;
  z-index: 10020;
  display: grid;
  place-items: center;
  padding: 22px;
  background:
    radial-gradient(circle at 48% 26%, rgba(255, 255, 255, 0.22), transparent 28%),
    rgba(8, 15, 26, 0.68);
  backdrop-filter: blur(18px);
}

.memory-card-modal__panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 0.92fr) minmax(280px, 1.08fr);
  width: min(760px, 100%);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(236, 245, 250, 0.9)),
    var(--theme-surface);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.28);
}

:global(.dark) .memory-card-modal__panel {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(18, 42, 56, 0.92)),
    var(--theme-surface);
}

.memory-card-modal__close {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 2;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  color: var(--theme-text-muted);
  background: var(--theme-surface-soft);
}

.memory-card-modal__visual {
  min-height: 430px;
  background:
    radial-gradient(circle at 30% 26%, color-mix(in srgb, var(--theme-accent) 20%, transparent), transparent 34%),
    color-mix(in srgb, var(--theme-accent) 7%, var(--theme-surface));
}

.memory-card-modal__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.memory-card-modal__fallback {
  display: grid;
  height: 100%;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: var(--theme-accent-strong);
  font-weight: 900;
}

.memory-card-modal__body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 34px;
}

.memory-card-modal__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-accent-strong);
  font-size: 12px;
  font-weight: 900;
}

.memory-card-modal__body h2 {
  margin: 12px 0 10px;
  color: var(--theme-text-primary);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1;
}

.memory-card-modal__body p {
  margin: 0;
  color: var(--theme-text-muted);
  line-height: 1.7;
}

.memory-card-modal__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.memory-card-modal__meta span,
.memory-card-modal__excerpt,
.memory-card-modal__message {
  border: 1px solid var(--theme-border);
  background: var(--theme-surface-soft);
  color: var(--theme-text-muted);
}

.memory-card-modal__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 13px;
}

.memory-card-modal__message,
.memory-card-modal__excerpt {
  margin: 18px 0 0;
  border-radius: 18px;
  padding: 14px;
  line-height: 1.65;
}

.memory-card-modal__message {
  display: flex;
  gap: 10px;
}

.memory-card-modal__message strong,
.memory-card-modal__message-content {
  display: block;
}

.memory-card-modal__message strong {
  color: var(--theme-text-primary);
  margin-bottom: 3px;
}

.memory-card-modal__actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.memory-card-modal__actions button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  font-weight: 900;
}

.memory-card-modal__secondary {
  flex: 0 0 auto;
  padding: 0 16px;
  border: 1px solid var(--theme-border);
  color: var(--theme-text-primary);
  background: var(--theme-surface-soft);
}

.memory-card-modal__primary {
  flex: 1;
  padding: 0 22px;
  color: var(--theme-bg-elevated);
  background: linear-gradient(135deg, var(--theme-accent-strong), var(--theme-accent));
}

.memory-card-enter-active,
.memory-card-leave-active {
  transition: opacity 180ms ease;
}

.memory-card-enter-active .memory-card-modal__panel,
.memory-card-leave-active .memory-card-modal__panel {
  transition: transform 220ms ease, opacity 180ms ease;
}

.memory-card-enter-from,
.memory-card-leave-to {
  opacity: 0;
}

.memory-card-enter-from .memory-card-modal__panel,
.memory-card-leave-to .memory-card-modal__panel {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

@media (max-width: 720px) {
  .memory-card-modal__panel {
    grid-template-columns: 1fr;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }

  .memory-card-modal__visual {
    min-height: 220px;
  }

  .memory-card-modal__body {
    padding: 24px;
  }
}
</style>
