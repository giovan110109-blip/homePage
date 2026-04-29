<template>
  <div
    class="theme-page min-h-screen"
    @mousemove="handleGlobalMouseMove"
    @mouseleave="handleGlobalMouseLeave"
  >
    <!-- Hero Banner Section -->
    <section
      class="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <!-- DotGrid Background -->
      <div class="fixed inset-0 z-0 h-full w-full">
        <DotGrid
          ref="dotGridRef"
          :dot-size="4"
          :gap="20"
          :base-color="dotGridColors.base"
          :active-color="dotGridColors.active"
          :proximity="120"
          :speed-trigger="60"
          :shock-radius="80"
          :shock-strength="0.8"
          :max-speed="2000"
          :resistance="800"
          :return-duration="1.5"
          class="w-full h-full"
        />
      </div>

      <!-- Main Content -->
      <div
        class="relative z-10 flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <!-- Avatar (Mobile First) -->
        <div class="flex-shrink-0 mb-8 lg:mb-0 lg:order-2 lg:ml-12">
          <div
            class="relative cursor-pointer group"
            role="link"
            tabindex="0"
            @click="goToAdmin"
            @keydown.enter="goToAdmin"
            @keydown.space.prevent="goToAdmin"
          >
            <div
              class="avatar-shell w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-sm transition-all duration-300"
            >
              <img
                :src="siteInfoStore.info.avatar"
                :alt="siteInfoStore.info.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <!-- Glow effect around avatar -->
            <div class="avatar-glow absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-300"></div>
            <div
              class="activity-status"
              aria-live="polite"
              aria-label="今日动态状态"
              :class="{ 'activity-status--editable': canManageActivityStatus }"
              @click.stop
              @keydown.stop
            >
              <span class="activity-status__pulse" aria-hidden="true"></span>
              <span class="activity-status__prefix">今天在</span>
              <select
                v-if="canManageActivityStatus"
                class="activity-status__select"
                :value="currentActivity"
                :disabled="isSavingActivityStatus"
                aria-label="选择今天的状态"
                title="选择今天的状态"
                @change="handleActivityStatusChange"
                @click.stop
                @keydown.stop
              >
                <option
                  v-for="status in activityStatuses"
                  :key="status"
                  :value="status"
                >
                  {{ status }}
                </option>
              </select>
              <Transition v-else name="activity-status-slide" mode="out-in">
                <span :key="currentActivity" class="activity-status__text">
                  {{ currentActivity }}
                </span>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Profile Info -->
        <div class="flex-1 max-w-2xl text-center lg:text-left lg:order-1">
          <div class="animate-fade-in-up">
            <div class="mb-6">
              <SplitText
                :text="siteInfoStore.info.title"
                class-name="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
                :delay="100"
                :duration="0.8"
                ease="power3.out"
                split-type="chars"
                :from="{ opacity: 0, y: 60, rotationX: -90 }"
                :to="{ opacity: 1, y: 0, rotationX: 0 }"
                :threshold="0.2"
                text-align="left"
              />
            </div>

            <SplitText
              :text="`我是 ${siteInfoStore.info.name}`"
              class-name="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4"
              :delay="120"
              :duration="0.6"
              ease="power2.out"
              split-type="chars"
              :from="{ opacity: 0, y: 30, scale: 0.8 }"
              :to="{ opacity: 1, y: 0, scale: 1 }"
              :threshold="0.1"
              text-align="left"
            />

            <SplitText
              :text="siteInfoStore.info.bio"
              class-name="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
              :delay="80"
              :duration="0.5"
              ease="power2.out"
              split-type="words"
              :from="{ opacity: 0, y: 20 }"
              :to="{ opacity: 1, y: 0 }"
              :threshold="0.1"
              text-align="left"
            />

            <!-- Social Links -->
            <!-- <div class="flex flex-wrap gap-3 justify-center lg:justify-start">
              <a
                v-for="link in personalStore.info.socialLinks"
                :key="link.platform"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white/20 dark:bg-white/10 backdrop-blur-md border border-gray-300/30 dark:border-white/20 rounded-lg hover:bg-white/30 dark:hover:bg-white/20 hover:border-gray-400/40 dark:hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                <Github v-if="link.icon === 'github'" class="w-4 h-4 mr-2" />
                <ExternalLink v-else-if="link.icon === 'globe'" class="w-4 h-4 mr-2" />
                {{ link.platform }}
              </a>
            </div> -->
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { useSiteInfoStore } from "@/stores/siteInfo";
import { useAuthStore } from "@/stores/auth";
import { useAuthUiStore } from "@/stores/authUi";
import SplitText from "@/components/SplitText.vue";
import DotGrid from "@/components/DotGrid.vue";
import { useTheme } from "@/composables/useTheme";
import { buildAdminSsoUrl } from "@/utils/admin";

const dotGridRef = ref<InstanceType<typeof DotGrid>>();
const siteInfoStore = useSiteInfoStore();
const authStore = useAuthStore();
const authUiStore = useAuthUiStore();
const { isDark } = useTheme();
const canManageActivityStatus = computed(() => authStore.isAdminPlus);
const activityStatuses = ["写代码", "修图", "看电影", "摸鱼中"] as const;
type ActivityStatus = (typeof activityStatuses)[number];

const currentActivityIndex = shallowRef(0);
const isSavingActivityStatus = shallowRef(false);
const getTodayDateKey = () => {
  const now = new Date();
  const localTime = now.getTime() - now.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 10);
};
const isActivityStatus = (value: string): value is ActivityStatus =>
  activityStatuses.includes(value as ActivityStatus);
const savedActivityStatus = computed(() => {
  const status = siteInfoStore.info.activityStatus;
  if (
    siteInfoStore.info.activityStatusDate !== getTodayDateKey() ||
    !isActivityStatus(status)
  ) {
    return "";
  }

  return status;
});
const currentActivity = computed(
  () =>
    savedActivityStatus.value ||
    (canManageActivityStatus.value
      ? activityStatuses[0]
      : activityStatuses[currentActivityIndex.value]),
);
let activityStatusTimer: ReturnType<typeof window.setInterval> | undefined;

const dotGridColors = computed(() => ({
  base: isDark.value ? "#334155" : "#cbd5e1",
  active: isDark.value ? "#60a5fa" : "#2563eb",
}));

const handleGlobalMouseMove = (event: MouseEvent) => {
  if (dotGridRef.value) {
    dotGridRef.value.handleMouseMove(event);
  }
};

const handleGlobalMouseLeave = () => {
  if (dotGridRef.value) {
    dotGridRef.value.handleMouseLeave();
  }
};

onMounted(() => {
  activityStatusTimer = window.setInterval(() => {
    currentActivityIndex.value =
      (currentActivityIndex.value + 1) % activityStatuses.length;
  }, 3200);
});

onUnmounted(() => {
  if (activityStatusTimer !== undefined) {
    window.clearInterval(activityStatusTimer);
  }
});

const hasAvailableSession = computed(
  () => authStore.isLoggedIn && !authStore.isSessionExpired,
);

const handleActivityStatusChange = async (event: Event) => {
  if (!canManageActivityStatus.value || isSavingActivityStatus.value) return;

  const nextStatus = (event.target as HTMLSelectElement).value;
  if (!isActivityStatus(nextStatus)) return;

  isSavingActivityStatus.value = true;
  try {
    await siteInfoStore.updateActivityStatus(nextStatus, getTodayDateKey());
    ElMessage.success("今天的状态已更新");
  } catch (error: any) {
    ElMessage.error(error?.message || "状态更新失败，请稍后再试");
  } finally {
    isSavingActivityStatus.value = false;
  }
};

const goToAdmin = () => {
  if (hasAvailableSession.value) {
    window.location.href = buildAdminSsoUrl(authStore.token);
    return;
  }

  if (authStore.isSessionExpired) {
    authStore.logout();
    ElMessage.info("登录状态已过期，请重新登录");
  }

  authUiStore.openLoginModal();
};
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes activityFloat {
  0%,
  100% {
    transform: translateY(0) rotate(-1deg);
  }
  50% {
    transform: translateY(-6px) rotate(1deg);
  }
}

@keyframes activityPulse {
  0%,
  100% {
    opacity: 0.72;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.45);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.project-card {
  animation: fadeInUp 0.6s ease-out both;
}

.site-card {
  animation: fadeInUp 0.6s ease-out both;
}

.avatar-shell {
  transition:
    border-color 0.3s ease,
    transform 0.3s ease;
}

.group:hover .avatar-shell {
  border-color: color-mix(in srgb, var(--theme-accent) 48%, transparent);
}

.avatar-glow {
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--theme-accent) 22%, transparent) 0%,
    transparent 70%
  );
}

.group:hover .avatar-glow {
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--theme-accent) 38%, transparent) 0%,
    transparent 72%
  );
}

.activity-status {
  position: absolute;
  right: -0.5rem;
  bottom: 2.5rem;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 9.75rem;
  padding: 0.55rem 0.78rem;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 34%, transparent);
  border-radius: 999px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme-surface-strong) 92%, transparent),
      color-mix(in srgb, var(--theme-bg-soft) 76%, transparent)
    ),
    color-mix(in srgb, var(--theme-surface-strong) 88%, transparent);
  box-shadow:
    0 16px 36px color-mix(in srgb, var(--theme-accent) 18%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  color: var(--theme-text-secondary);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  backdrop-filter: blur(18px);
  animation: activityFloat 4.8s ease-in-out infinite;
}

.activity-status--editable {
  padding-right: 1.95rem;
  cursor: default;
}

.activity-status--editable::after {
  position: absolute;
  right: 0.82rem;
  color: var(--theme-text-muted);
  font-size: 0.68rem;
  content: "▾";
  pointer-events: none;
}

.activity-status__pulse {
  width: 0.48rem;
  height: 0.48rem;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--theme-accent-strong);
  box-shadow: 0 0 0 0.28rem var(--theme-accent-soft);
  animation: activityPulse 1.8s ease-in-out infinite;
}

.activity-status__prefix {
  color: var(--theme-text-muted);
}

.activity-status__text {
  display: inline-block;
  min-width: 3.4rem;
  color: var(--theme-text-primary);
}

.activity-status__select {
  min-width: 3.4rem;
  max-width: 5rem;
  border: 0;
  outline: 0;
  appearance: none;
  background: transparent;
  color: var(--theme-text-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.activity-status__select:disabled {
  cursor: wait;
  opacity: 0.64;
}

.activity-status__select:focus-visible {
  border-radius: 0.45rem;
  box-shadow: 0 0 0 3px var(--theme-accent-soft);
}

.activity-status-slide-enter-active,
.activity-status-slide-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease,
    filter 220ms ease;
}

.activity-status-slide-enter-from {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(0.45rem);
}

.activity-status-slide-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(-0.45rem);
}

@media (max-width: 640px) {
  .activity-status {
    right: 50%;
    bottom: -0.45rem;
    min-width: 9.2rem;
    transform: translateX(50%);
    animation: none;
  }
}
</style>
