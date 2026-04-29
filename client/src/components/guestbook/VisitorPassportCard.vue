<script setup lang="ts">
import { computed } from "vue";
import { X } from "lucide-vue-next";
import { sanitizeSvg } from "@/utils/sanitize";

interface VisitorPassportCardProps {
  name: string;
  avatar?: string;
  location?: string | null;
  browser?: string;
  os?: string;
  deviceType?: string;
  createdAt: string;
  visitorNumber?: number | null;
  badge?: string;
}

const props = withDefaults(defineProps<VisitorPassportCardProps>(), {
  avatar: "",
  location: "",
  browser: "",
  os: "",
  deviceType: "",
  visitorNumber: null,
  badge: "新来的朋友",
});

const emit = defineEmits<{
  close: [];
}>();

const isHttpAvatar = computed(() => /^https?:\/\//i.test(props.avatar || ""));
const sanitizedAvatar = computed(() =>
  props.avatar ? sanitizeSvg(props.avatar) : "",
);
const displayName = computed(() => props.name?.trim() || "神秘访客");
const displayLocation = computed(() => props.location?.trim() || "神秘坐标");
const displayBadge = computed(() => props.badge?.trim() || "新来的朋友");
const displayNumber = computed(() => {
  const number = Number(props.visitorNumber || 0);
  return number > 0 ? number : undefined;
});
const passportNo = computed(() =>
  displayNumber.value
    ? `NO.${String(displayNumber.value).padStart(6, "0")}`
    : "NO.PENDING",
);
const deviceSummary = computed(() => {
  const parts = [props.os, props.browser, props.deviceType]
    .map((item) => item?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "未知设备";
});
const visitTime = computed(() => {
  const date = new Date(props.createdAt);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
});
</script>

<template>
  <article class="visitor-passport-card" aria-live="polite">
    <button
      class="visitor-passport-card__close"
      type="button"
      aria-label="关闭访客护照"
      @click="emit('close')"
    >
      <X class="visitor-passport-card__close-icon" />
    </button>

    <div class="visitor-passport-card__paper">
      <div class="visitor-passport-card__header">
        <span class="visitor-passport-card__kicker">VISITOR PASSPORT</span>
        <strong class="visitor-passport-card__number">{{ passportNo }}</strong>
      </div>

      <div class="visitor-passport-card__body">
        <div class="visitor-passport-card__avatar-shell">
          <img
            v-if="isHttpAvatar"
            :src="avatar"
            :alt="displayName"
            class="visitor-passport-card__avatar"
          />
          <div
            v-else-if="sanitizedAvatar"
            class="visitor-passport-card__avatar-svg"
            v-html="sanitizedAvatar"
          ></div>
          <div v-else class="visitor-passport-card__avatar-fallback">
            {{ displayName.slice(0, 1).toUpperCase() }}
          </div>
        </div>

        <div class="visitor-passport-card__info">
          <span class="visitor-passport-card__label">入境访客</span>
          <h3 class="visitor-passport-card__name">{{ displayName }}</h3>
          <p class="visitor-passport-card__meta">{{ displayLocation }}</p>
          <p class="visitor-passport-card__meta">{{ deviceSummary }}</p>
          <p class="visitor-passport-card__time">{{ visitTime }}</p>
        </div>
      </div>

      <div class="visitor-passport-card__stamp" aria-hidden="true">
        <span>VISIT</span>
        <strong>APPROVED</strong>
        <small>GIOVAN.CN</small>
      </div>
    </div>
  </article>
</template>

<style scoped>
.visitor-passport-card {
  position: relative;
  max-width: 680px;
  margin: -4px auto 28px;
  animation: visitorPassportRise 520ms cubic-bezier(0.19, 1, 0.22, 1) both;
}

.visitor-passport-card__paper {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border: 1px solid
    color-mix(in srgb, var(--theme-accent) 28%, var(--theme-border));
  border-radius: 30px;
  color: var(--theme-text-primary);
  background:
    radial-gradient(
      circle at 88% 16%,
      color-mix(in srgb, var(--theme-accent) 18%, transparent),
      transparent 28%
    ),
    radial-gradient(circle at 8% 82%, rgba(185, 28, 28, 0.13), transparent 30%),
    repeating-linear-gradient(
      90deg,
      rgba(120, 53, 15, 0.045) 0 1px,
      transparent 1px 14px
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme-surface-strong) 94%, #fff7ed),
      var(--theme-surface)
    );
  box-shadow: 0 26px 80px
    color-mix(in srgb, var(--theme-accent) 16%, transparent);
  isolation: isolate;
}

.visitor-passport-card__paper::before {
  content: "";
  position: absolute;
  inset: 12px;
  z-index: -1;
  border: 1px dashed color-mix(in srgb, var(--theme-accent) 24%, transparent);
  border-radius: 22px;
}

.visitor-passport-card__paper::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background-image: radial-gradient(
    rgba(120, 53, 15, 0.14) 0.7px,
    transparent 0.7px
  );
  background-size: 9px 9px;
  opacity: 0.38;
}

.visitor-passport-card__close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--theme-border) 80%, transparent);
  border-radius: 999px;
  color: var(--theme-text-muted);
  background: color-mix(in srgb, var(--theme-surface-strong) 82%, transparent);
  transition: all 180ms ease;
}

.visitor-passport-card__close:hover {
  color: var(--theme-text-primary);
  transform: rotate(8deg) scale(1.04);
}

.visitor-passport-card__close-icon {
  width: 16px;
  height: 16px;
}

.visitor-passport-card__header,
.visitor-passport-card__body,
.visitor-passport-card__footer {
  position: relative;
  z-index: 1;
}

.visitor-passport-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 38px;
}

.visitor-passport-card__kicker {
  color: var(--theme-accent-strong);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.visitor-passport-card__number {
  color: color-mix(in srgb, var(--theme-text-muted) 88%, transparent);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13px;
  letter-spacing: 0.14em;
}

.visitor-passport-card__body {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  margin-top: 20px;
}

.visitor-passport-card__avatar-shell {
  display: grid;
  width: 112px;
  height: 112px;
  place-items: center;
  overflow: hidden;
  border: 4px solid
    color-mix(in srgb, var(--theme-bg-elevated) 76%, transparent);
  border-radius: 28px;
  background: color-mix(in srgb, var(--theme-accent-soft) 60%, transparent);
  box-shadow: 0 16px 34px rgba(120, 53, 15, 0.16);
  transform: rotate(-2deg);
}

.visitor-passport-card__avatar,
.visitor-passport-card__avatar-svg,
.visitor-passport-card__avatar-fallback {
  width: 100%;
  height: 100%;
}

.visitor-passport-card__avatar {
  object-fit: cover;
}

.visitor-passport-card__avatar-svg :deep(svg) {
  width: 100%;
  height: 100%;
}

.visitor-passport-card__avatar-fallback {
  display: grid;
  place-items: center;
  color: var(--theme-accent-strong);
  font-size: 42px;
  font-weight: 900;
}

.visitor-passport-card__label {
  display: inline-flex;
  margin-bottom: 4px;
  color: var(--theme-text-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.visitor-passport-card__name {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1;
}

.visitor-passport-card__meta,
.visitor-passport-card__time {
  margin: 8px 0 0;
  color: var(--theme-text-muted);
  font-size: 14px;
}

.visitor-passport-card__time {
  color: color-mix(
    in srgb,
    var(--theme-accent-strong) 76%,
    var(--theme-text-muted)
  );
  font-weight: 700;
}

.visitor-passport-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 20px;
}

.visitor-passport-card__rank,
.visitor-passport-card__badge {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
}

.visitor-passport-card__rank {
  color: #7f1d1d;
  background: rgba(254, 226, 226, 0.72);
}

.visitor-passport-card__badge {
  color: #92400e;
  background: rgba(254, 243, 199, 0.82);
}

.visitor-passport-card__stamp {
  position: absolute;
  right: 34px;
  bottom: 30px;
  z-index: 0;
  display: grid;
  width: 132px;
  height: 132px;
  place-items: center;
  border: 3px solid currentColor;
  border-radius: 999px;
  color: rgba(185, 28, 28, 0.72);
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1;
  text-align: center;
  transform: rotate(-11deg);
  animation: visitorPassportStamp 680ms 180ms
    cubic-bezier(0.18, 0.88, 0.26, 1.15) both;
}

.visitor-passport-card__stamp::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px dashed currentColor;
  border-radius: inherit;
}

.visitor-passport-card__stamp span,
.visitor-passport-card__stamp small {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.visitor-passport-card__stamp strong {
  display: block;
  margin-top: -12px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

:global(.dark) .visitor-passport-card__rank {
  color: #fecaca;
  background: rgba(127, 29, 29, 0.38);
}

:global(.dark) .visitor-passport-card__badge {
  color: #fde68a;
  background: rgba(120, 53, 15, 0.46);
}

:global(.dark) .visitor-passport-card__stamp {
  color: rgba(252, 165, 165, 0.62);
}

@keyframes visitorPassportRise {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96) rotateX(8deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0);
  }
}

@keyframes visitorPassportStamp {
  0% {
    opacity: 0;
    transform: translateY(-34px) scale(1.42) rotate(-11deg);
  }
  62% {
    opacity: 1;
    transform: translateY(4px) scale(0.9) rotate(-11deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(-11deg);
  }
}

@media (max-width: 640px) {
  .visitor-passport-card__paper {
    padding: 18px;
  }

  .visitor-passport-card__body {
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 14px;
  }

  .visitor-passport-card__avatar-shell {
    width: 80px;
    height: 80px;
    border-radius: 22px;
  }

  .visitor-passport-card__stamp {
    right: 18px;
    bottom: 18px;
    width: 96px;
    height: 96px;
  }

  .visitor-passport-card__stamp strong {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .visitor-passport-card,
  .visitor-passport-card__stamp {
    animation: none;
  }
}
</style>
