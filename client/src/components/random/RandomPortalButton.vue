<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Orbit, Shuffle, Sparkles } from "lucide-vue-next";
import request from "@/api/request";
import { recordFriendLinkClick } from "@/api/friendLink";
import MemoryCardModal from "@/components/random/MemoryCardModal.vue";
import {
  getEnabledRandomPortalTypes,
  getRandomPortalIntroText,
  isRandomPortalDestinationAllowed,
  type RandomPortalType,
} from "@/config/randomPortal";
import { getExternalLinkRedirectUrl } from "@/utils/external-link";
import { normalizeHttpUrl } from "@/utils/url";

interface RandomPortalDestination {
  type: RandomPortalType;
  label: string;
  title: string;
  description?: string;
  path?: string;
  externalUrl?: string;
  friendLinkId?: string;
  memory?: Record<string, any>;
}

const router = useRouter();
const isOpening = shallowRef(false);
const cardVisible = shallowRef(false);
const currentDestination = shallowRef<RandomPortalDestination | null>(null);
const portalStatus = computed(() => {
  if (isOpening.value) return "正在抽一张旧时光……";
  return getRandomPortalIntroText();
});

const waitForTransition = () => new Promise((resolve) => window.setTimeout(resolve, 860));

const goToDestination = async (destination: RandomPortalDestination) => {
  if (destination.type === "friend" && destination.friendLinkId) {
    recordFriendLinkClick(destination.friendLinkId).catch(() => undefined);
  }

  if (destination.externalUrl) {
    const normalizedUrl = normalizeHttpUrl(destination.externalUrl);
    if (!normalizedUrl) {
      ElMessage.warning("这个朋友站点坐标暂时失效了，再试一次吧");
      return;
    }
    window.location.href = getExternalLinkRedirectUrl(normalizedUrl);
    return;
  }

  await router.push(destination.path || "/");
};

const openRandomPortal = async () => {
  if (isOpening.value) return;

  const enabledTypes = getEnabledRandomPortalTypes();
  if (!enabledTypes.length) {
    ElMessage.warning("请先在 randomPortal 配置里开放至少一个路径");
    return;
  }

  isOpening.value = true;
  try {
    const [res] = await Promise.all([
      request.get("/random-portal", {
        params: { types: enabledTypes.join(",") },
      }) as Promise<{ data: RandomPortalDestination }>,
      waitForTransition(),
    ]);
    const destination = res?.data;

    if (!destination || !isRandomPortalDestinationAllowed(destination)) {
      ElMessage.warning("传送门返回了未开放路径，请检查 randomPortal 配置");
      return;
    }

    currentDestination.value = destination;
    cardVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "传送门暂时打不开，请稍后再试");
  } finally {
    isOpening.value = false;
  }
};

const confirmDestination = async () => {
  if (!currentDestination.value) return;
  cardVisible.value = false;
  await goToDestination(currentDestination.value);
};
</script>

<template>
  <div class="random-portal" :class="{ 'random-portal--opening': isOpening }">
    <button
      class="random-portal__button"
      type="button"
      :disabled="isOpening"
      aria-live="polite"
      @click="openRandomPortal"
    >
      <span class="random-portal__halo" aria-hidden="true"></span>
      <span class="random-portal__icon-wrap" aria-hidden="true">
        <Orbit v-if="isOpening" class="random-portal__orbit" />
        <Shuffle v-else class="random-portal__shuffle" />
      </span>
      <span class="random-portal__text">
        <span class="random-portal__label">抽一张记忆卡</span>
        <span class="random-portal__status">{{ portalStatus }}</span>
      </span>
      <Sparkles class="random-portal__sparkle" aria-hidden="true" />
    </button>

    <MemoryCardModal
      v-model="cardVisible"
      :destination="currentDestination"
      :drawing="isOpening"
      @redraw="openRandomPortal"
      @confirm="confirmDestination"
    />
  </div>
</template>

<style scoped>
@keyframes portalBreathe {
  0%,
  100% {
    transform: scale(0.88) rotate(0deg);
    opacity: 0.58;
  }
  50% {
    transform: scale(1.22) rotate(18deg);
    opacity: 0.94;
  }
}

@keyframes portalSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes portalSweep {
  0% {
    transform: translateX(-120%) rotate(10deg);
  }
  100% {
    transform: translateX(140%) rotate(10deg);
  }
}

.random-portal {
  position: fixed;
  right: max(1.5rem, env(safe-area-inset-right));
  bottom: calc(6.15rem + env(safe-area-inset-bottom));
  z-index: 60;
  display: flex;
  width: min(18rem, calc(100vw - 2rem));
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
  pointer-events: none;
}

.random-portal__button {
  position: relative;
  display: inline-flex;
  width: 4rem;
  height: 4rem;
  align-items: center;
  justify-content: flex-start;
  gap: 0.8rem;
  max-width: 100%;
  padding: 0.52rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 46%, transparent);
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.72), transparent 34%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(31, 82, 111, 0.94) 58%, rgba(9, 38, 53, 0.98));
  box-shadow:
    0 18px 48px color-mix(in srgb, var(--theme-accent) 24%, transparent),
    0 0 0 8px color-mix(in srgb, var(--theme-accent) 8%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
  color: #fff;
  cursor: pointer;
  isolation: isolate;
  pointer-events: auto;
  transform-origin: right center;
  transition:
    width 320ms cubic-bezier(0.2, 0.86, 0.24, 1),
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease,
    padding 320ms cubic-bezier(0.2, 0.86, 0.24, 1);
}

.random-portal__button::after {
  position: absolute;
  inset: -42% auto -42% 0;
  z-index: -1;
  width: 42%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  content: "";
  opacity: 0;
  transform: translateX(-120%) rotate(10deg);
}

.random-portal__button:hover:not(:disabled),
.random-portal__button:focus-visible,
.random-portal--opening .random-portal__button {
  width: 18rem;
  padding: 0.58rem 0.9rem 0.58rem 0.62rem;
  border-color: color-mix(in srgb, var(--theme-accent) 74%, #fff 26%);
  box-shadow:
    0 26px 74px color-mix(in srgb, var(--theme-accent) 32%, transparent),
    0 0 0 8px color-mix(in srgb, var(--theme-accent) 10%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: translateX(-0.25rem);
}

.random-portal__button:hover:not(:disabled)::after,
.random-portal__button:focus-visible::after,
.random-portal--opening .random-portal__button::after {
  animation: portalSweep 920ms ease both;
  opacity: 1;
}

.random-portal__button:disabled {
  cursor: wait;
}

.random-portal__button:focus-visible {
  outline: 0;
}

.random-portal__halo {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 24% 50%, rgba(120, 174, 205, 0.64), transparent 30%),
    radial-gradient(circle at 84% 12%, rgba(255, 230, 180, 0.32), transparent 24%);
  animation: portalBreathe 3.8s ease-in-out infinite;
}

.random-portal__icon-wrap {
  display: grid;
  width: 2.95rem;
  height: 2.95rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.random-portal__orbit,
.random-portal__shuffle {
  width: 1.34rem;
  height: 1.34rem;
}

.random-portal__orbit {
  animation: portalSpin 1.1s linear infinite;
}

.random-portal__text {
  display: flex;
  max-width: 0;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  opacity: 0;
  text-align: left;
  transform: translateX(0.55rem);
  transition:
    max-width 300ms cubic-bezier(0.2, 0.86, 0.24, 1),
    opacity 180ms ease,
    transform 260ms ease;
  white-space: nowrap;
}

.random-portal__button:hover .random-portal__text,
.random-portal__button:focus-visible .random-portal__text,
.random-portal--opening .random-portal__text {
  max-width: 12.5rem;
  opacity: 1;
  transform: translateX(0);
}

.random-portal__label {
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.1;
}

.random-portal__status {
  max-width: 12.25rem;
  margin-top: 0.3rem;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.random-portal__sparkle {
  width: 1.08rem;
  height: 1.08rem;
  flex: 0 0 auto;
  color: rgba(255, 232, 172, 0.92);
  opacity: 0;
  transform: scale(0.7) rotate(-12deg);
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.random-portal__button:hover .random-portal__sparkle,
.random-portal__button:focus-visible .random-portal__sparkle,
.random-portal--opening .random-portal__sparkle {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

@media (max-width: 640px) {
  .random-portal {
    right: max(1rem, env(safe-area-inset-right));
    bottom: calc(5.45rem + env(safe-area-inset-bottom));
    width: min(17rem, calc(100vw - 1.6rem));
  }

  .random-portal__button:hover:not(:disabled),
  .random-portal__button:focus-visible,
  .random-portal--opening .random-portal__button {
    width: min(17rem, calc(100vw - 1.6rem));
  }
}

@media (prefers-reduced-motion: reduce) {
  .random-portal__halo,
  .random-portal__orbit,
  .random-portal__button::after {
    animation: none;
  }

  .random-portal__button,
  .random-portal__text,
  .random-portal__sparkle {
    transition: none;
  }
}
</style>
