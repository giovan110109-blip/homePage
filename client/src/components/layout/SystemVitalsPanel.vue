<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { Activity, Bug, Gauge, Radio, Rocket, Server, Signal } from 'lucide-vue-next'
import { getSystemVitals, type SystemVitals } from '@/api/systemVitals'

const fallbackVitals: SystemVitals = {
  uptime: 99.96,
  latency: 42,
  deployedAt: new Date().toISOString(),
  todayVisits: 0,
  recentError: null,
  checkedAt: new Date().toISOString(),
}

const vitals = shallowRef<SystemVitals>(fallbackVitals)
const isLoading = shallowRef(true)
const hasLiveData = shallowRef(false)
const pulseSamples = shallowRef([18, 18, 28, 13, 50, 11, 23, 18, 18, 34, 16, 44, 12, 24, 18, 18])

let pulseTimer: ReturnType<typeof setInterval> | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

const uptimeText = computed(() => `${vitals.value.uptime.toFixed(2)}%`)
const latencyText = computed(() => `${Math.round(vitals.value.latency)}ms`)
const visitsText = computed(() => vitals.value.todayVisits.toLocaleString('zh-CN'))
const errorText = computed(() => {
  if (!vitals.value.recentError) return '无异常'
  return `${vitals.value.recentError.status} ${vitals.value.recentError.path}`
})

const deployText = computed(() => {
  const value = vitals.value.deployedAt
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value.startsWith('#') ? value : `#${value}`

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}.${day}`
})

const healthTone = computed(() => {
  if (vitals.value.recentError) return 'warning'
  if (vitals.value.uptime >= 99.9 && vitals.value.latency < 160) return 'stable'
  return 'watching'
})

const healthLabel = computed(() => {
  const labels = {
    stable: 'STABLE',
    watching: 'WATCHING',
    warning: 'ATTENTION',
  }

  return labels[healthTone.value]
})

const pulsePoints = computed(() => {
  const width = 220
  const height = 58
  const lastIndex = Math.max(1, pulseSamples.value.length - 1)

  return pulseSamples.value
    .map((sample, index) => {
      const x = (index / lastIndex) * width
      const y = height - (Math.min(56, Math.max(6, sample)) / 56) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const statItems = computed(() => [
  {
    label: '在线率',
    value: uptimeText.value,
    meta: hasLiveData.value ? '24h' : '待同步',
    icon: Signal,
  },
  {
    label: '接口延迟',
    value: latencyText.value,
    meta: 'avg',
    icon: Gauge,
  },
  {
    label: '最近部署',
    value: deployText.value,
    meta: 'release',
    icon: Rocket,
  },
  {
    label: '今日访问',
    value: visitsText.value,
    meta: 'views',
    icon: Radio,
  },
])

const fetchVitals = async () => {
  try {
    const response = await getSystemVitals()
    vitals.value = response.data
    hasLiveData.value = true
  } catch (_error) {
    hasLiveData.value = false
  } finally {
    isLoading.value = false
  }
}

const updatePulse = () => {
  const latencyPulse = Math.min(54, Math.max(12, Math.round(vitals.value.latency / 5)))
  const errorPulse = vitals.value.recentError ? 48 : 24
  const nextSample = Math.random() > 0.68 ? errorPulse : latencyPulse + Math.round(Math.random() * 8 - 4)

  pulseSamples.value = [...pulseSamples.value.slice(1), nextSample]
}

onMounted(() => {
  fetchVitals()
  pulseTimer = setInterval(updatePulse, 1400)
  refreshTimer = setInterval(fetchVitals, 60 * 1000)
})

onUnmounted(() => {
  if (pulseTimer) clearInterval(pulseTimer)
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <section class="system-vitals" :class="`system-vitals--${healthTone}`" aria-label="系统生命体征">
    <div class="system-vitals__header">
      <div class="system-vitals__title-group">
        <span class="system-vitals__mark">
          <Activity class="system-vitals__mark-icon" />
        </span>
        <div>
          <p class="system-vitals__eyebrow">SYSTEM VITALS</p>
          <h3 class="system-vitals__title">系统生命体征</h3>
        </div>
      </div>

      <div class="system-vitals__state">
        <span class="system-vitals__state-dot"></span>
        <span>{{ isLoading ? 'SYNCING' : healthLabel }}</span>
      </div>
    </div>

    <div class="system-vitals__body">
      <div class="system-vitals__monitor">
        <div class="system-vitals__screen">
          <svg class="system-vitals__wave" viewBox="0 0 220 58" role="img" aria-label="接口心电图">
            <defs>
              <linearGradient id="system-vitals-wave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop class="system-vitals__wave-stop system-vitals__wave-stop--start" offset="0%" />
                <stop class="system-vitals__wave-stop system-vitals__wave-stop--middle" offset="52%" />
                <stop class="system-vitals__wave-stop system-vitals__wave-stop--end" offset="100%" />
              </linearGradient>
            </defs>
            <polyline class="system-vitals__wave-line" :points="pulsePoints" />
          </svg>
          <div class="system-vitals__scan"></div>
        </div>

        <div class="system-vitals__error">
          <Bug class="system-vitals__error-icon" />
          <div>
            <span class="system-vitals__error-label">最近错误</span>
            <strong>{{ errorText }}</strong>
          </div>
        </div>
      </div>

      <div class="system-vitals__grid">
        <div v-for="item in statItems" :key="item.label" class="system-vitals__metric">
          <component :is="item.icon" class="system-vitals__metric-icon" />
          <span class="system-vitals__metric-label">{{ item.label }}</span>
          <strong class="system-vitals__metric-value">{{ item.value }}</strong>
          <span class="system-vitals__metric-meta">{{ item.meta }}</span>
        </div>
      </div>
    </div>

    <div class="system-vitals__footer">
      <span class="system-vitals__node">
        <Server class="system-vitals__node-icon" />
        giovan.cn edge node
      </span>
      <span>{{ hasLiveData ? 'live telemetry' : 'local fallback' }}</span>
    </div>
  </section>
</template>

<style scoped>
.system-vitals {
  --vitals-bg:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(244, 247, 251, 0.9)),
    repeating-linear-gradient(90deg, rgba(120, 174, 205, 0.12) 0 1px, transparent 1px 28px);
  --vitals-border: color-mix(in srgb, var(--theme-accent) 30%, var(--theme-border));
  --vitals-panel: color-mix(in srgb, var(--theme-surface-strong) 82%, transparent);
  --vitals-panel-soft: color-mix(in srgb, var(--theme-surface-soft) 78%, transparent);
  --vitals-text: var(--theme-text-primary);
  --vitals-heading: var(--theme-text-primary);
  --vitals-muted: var(--theme-text-muted);
  --vitals-accent: var(--theme-accent);
  --vitals-accent-strong: var(--theme-accent-strong);
  --vitals-good: #10b981;
  --vitals-warn: #d97706;
  --vitals-grid: color-mix(in srgb, var(--theme-accent) 18%, transparent);
  --vitals-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--vitals-border);
  border-radius: 8px;
  padding: 18px;
  background: var(--vitals-bg);
  color: var(--vitals-text);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), var(--vitals-shadow);
}

:global(:root.dark) .system-vitals {
  --vitals-bg:
    linear-gradient(135deg, rgba(8, 17, 31, 0.92), rgba(14, 34, 48, 0.86)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 28px);
  --vitals-border: rgba(159, 202, 228, 0.24);
  --vitals-panel: rgba(15, 23, 42, 0.48);
  --vitals-panel-soft: rgba(15, 23, 42, 0.46);
  --vitals-text: #e5eef9;
  --vitals-heading: #f8fafc;
  --vitals-muted: rgba(203, 213, 225, 0.68);
  --vitals-accent: #9fcae4;
  --vitals-accent-strong: #c5e1f1;
  --vitals-good: #86efac;
  --vitals-warn: #fbbf24;
  --vitals-grid: rgba(148, 163, 184, 0.08);
  --vitals-shadow: 0 20px 48px rgba(8, 17, 31, 0.22);
}

.system-vitals::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  background:
    radial-gradient(circle at 16% 20%, color-mix(in srgb, var(--vitals-accent) 22%, transparent), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 42%);
}

.system-vitals__header,
.system-vitals__body,
.system-vitals__footer {
  position: relative;
  z-index: 1;
}

.system-vitals__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.system-vitals__title-group,
.system-vitals__state,
.system-vitals__node,
.system-vitals__error {
  display: flex;
  align-items: center;
}

.system-vitals__title-group {
  gap: 10px;
}

.system-vitals__mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--vitals-good) 44%, transparent);
  border-radius: 8px;
  background: var(--vitals-panel-soft);
  color: var(--vitals-good);
  box-shadow: 0 0 26px color-mix(in srgb, var(--vitals-good) 16%, transparent);
}

.system-vitals__mark-icon {
  width: 19px;
  height: 19px;
}

.system-vitals__eyebrow {
  margin: 0;
  color: color-mix(in srgb, var(--vitals-accent-strong) 82%, var(--vitals-muted));
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 10px;
  letter-spacing: 0;
}

.system-vitals__title {
  margin: 2px 0 0;
  color: var(--vitals-heading);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.system-vitals__state {
  flex: 0 0 auto;
  gap: 7px;
  border: 1px solid color-mix(in srgb, var(--vitals-good) 32%, transparent);
  border-radius: 999px;
  padding: 5px 9px;
  background: color-mix(in srgb, var(--vitals-good) 14%, transparent);
  color: color-mix(in srgb, var(--vitals-good) 88%, var(--vitals-heading));
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 10px;
  line-height: 1;
}

.system-vitals--warning .system-vitals__state {
  border-color: color-mix(in srgb, var(--vitals-warn) 38%, transparent);
  background: color-mix(in srgb, var(--vitals-warn) 16%, transparent);
  color: color-mix(in srgb, var(--vitals-warn) 88%, var(--vitals-heading));
}

.system-vitals__state-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 14px currentColor;
}

.system-vitals__body {
  display: grid;
  grid-template-columns: minmax(230px, 0.92fr) minmax(280px, 1.08fr);
  gap: 14px;
}

.system-vitals__monitor {
  min-width: 0;
}

.system-vitals__screen {
  position: relative;
  overflow: hidden;
  height: 112px;
  border: 1px solid color-mix(in srgb, var(--vitals-accent) 20%, transparent);
  border-radius: 8px;
  background:
    linear-gradient(var(--vitals-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--vitals-grid) 1px, transparent 1px),
    color-mix(in srgb, var(--vitals-panel-soft) 82%, transparent);
  background-size: 100% 18px, 22px 100%, auto;
}

.system-vitals__wave {
  position: absolute;
  inset: 22px 14px 18px;
  width: calc(100% - 28px);
  height: calc(100% - 40px);
  overflow: visible;
}

.system-vitals__wave-line {
  fill: none;
  stroke: url("#system-vitals-wave");
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--vitals-good) 58%, transparent));
}

.system-vitals__wave-stop--start {
  stop-color: var(--vitals-accent);
}

.system-vitals__wave-stop--middle {
  stop-color: var(--vitals-good);
}

.system-vitals__wave-stop--end {
  stop-color: var(--vitals-warn);
}

.system-vitals__scan {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -35%;
  width: 30%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--vitals-accent) 20%, transparent), transparent);
  animation: vitals-scan 3.6s linear infinite;
}

.system-vitals__error {
  gap: 9px;
  min-height: 52px;
  margin-top: 10px;
  border: 1px solid color-mix(in srgb, var(--vitals-accent) 18%, transparent);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--vitals-panel-soft);
}

.system-vitals__error-icon {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  color: var(--vitals-warn);
}

.system-vitals__error-label,
.system-vitals__metric-label,
.system-vitals__metric-meta {
  display: block;
  color: var(--vitals-muted);
  font-size: 11px;
  line-height: 1.2;
}

.system-vitals__error strong {
  display: block;
  max-width: 200px;
  overflow: hidden;
  color: var(--vitals-heading);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.system-vitals__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.system-vitals__metric {
  position: relative;
  min-width: 0;
  min-height: 86px;
  border: 1px solid color-mix(in srgb, var(--vitals-accent) 18%, transparent);
  border-radius: 8px;
  padding: 12px;
  background: var(--vitals-panel);
}

.system-vitals__metric-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 16px;
  height: 16px;
  color: color-mix(in srgb, var(--vitals-accent) 78%, var(--vitals-muted));
}

.system-vitals__metric-value {
  display: block;
  max-width: calc(100% - 22px);
  margin-top: 9px;
  overflow: hidden;
  color: var(--vitals-heading);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: clamp(18px, 2vw, 22px);
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.system-vitals__metric-meta {
  margin-top: 8px;
  color: color-mix(in srgb, var(--vitals-good) 78%, var(--vitals-muted));
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  text-transform: uppercase;
}

.system-vitals__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  color: color-mix(in srgb, var(--vitals-muted) 82%, transparent);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 10px;
}

.system-vitals__node {
  gap: 6px;
}

.system-vitals__node-icon {
  width: 13px;
  height: 13px;
}

@keyframes vitals-scan {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(460%);
  }
}

@media (max-width: 900px) {
  .system-vitals__body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .system-vitals {
    padding: 14px;
  }

  .system-vitals__header,
  .system-vitals__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .system-vitals__grid {
    grid-template-columns: 1fr;
  }

  .system-vitals__metric {
    min-height: 76px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .system-vitals__scan {
    animation: none;
  }
}
</style>
