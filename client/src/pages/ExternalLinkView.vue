<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20 flex items-center justify-center"
  >
    <div class="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
      <div
        class="relative min-h-[620px] bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-white/10 shadow-2xl overflow-hidden"
        :ref="el => cardRef = el as HTMLElement"
        @mousemove="handleCardMouseMove"
        @mouseleave="handleCardMouseLeave"
      >
        <!-- 鼠标跟随效果 -->
        <div
          v-if="cardEffect.show"
          class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
          :style="{
            left: cardEffect.x - 80 + 'px',
            top: cardEffect.y - 80 + 'px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.3) 30%, rgba(34, 197, 94, 0.15) 60%, transparent 90%)',
            boxShadow: '0 0 80px rgba(34, 197, 94, 0.5), 0 0 160px rgba(34, 197, 94, 0.3)'
          }"
        ></div>
        <header class="relative z-10 px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200/60 dark:border-white/10">
          <div class="flex items-center gap-3">
            <img
              src="/img/logo.png"
              alt="logo"
              class="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900/40"
            />
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">跳转提示</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">即将离开 Giovan</p>
            </div>
          </div>
        </header>

        <section class="relative z-10 px-6 py-6 sm:px-8">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">目标地址</div>
          <div class="flex items-center gap-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-white/5 p-4">
            <div class="flex-shrink-0">
              <img
                v-if="favicon"
                :src="favicon"
                class="w-9 h-9 rounded-lg"
                alt="favicon"
                @error="favicon = ''"
              />
              <div v-else class="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                {{ targetUrl.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-all">
                {{ targetUrl }}
              </div>
            </div>
          </div>
        </section>

        <section class="relative z-10 px-6 pb-2 sm:px-8">
          <div class="rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-4">
            <h2 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">提示信息</h2>
            <p class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              你将打开一个站外链接。该页面不受本站控制，请自行判断其安全性与内容合法性。
              如果不确定，可以先返回站内或复制链接后自行打开。
            </p>
          </div>
        </section>

        <section class="relative z-10 px-6 pb-6 sm:px-8 flex flex-col sm:flex-row gap-3">
          <AppButton
            variant="reset"
            size="sm"
            class="w-full sm:w-auto"
            @click="handleReturn"
          >
            返回站内
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            class="w-full sm:w-auto"
            @click="handleContinue"
          >
            继续访问外部网站
          </AppButton>
        </section>

        <section class="relative z-10 px-6 pb-6 sm:px-8">
          <div class="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 p-5">
            <div class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">安全提示</div>
            <ul class="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• 谨慎识别钓鱼/镜像网站</li>
              <li>• 不随意输入账号、密码与隐私信息</li>
              <li>• 不确定时不要进行金钱交易</li>
              <li>• 建议检查网址拼写是否正确</li>
              <li>• 发现异常请立即关闭页面</li>
            </ul>
          </div>
        </section>

        <section v-if="countdown > 0" class="relative z-10 px-6 pb-6 sm:px-8 text-center">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ countdown }} 秒后自动跳转...
            <button @click="cancelCountdown" class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold">取消</button>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()

const cardRef = ref<HTMLElement | null>(null)
const cardEffect = reactive<{ x: number; y: number; show: boolean }>({
  x: 0,
  y: 0,
  show: false
})

// 获取目标URL
const targetUrl = computed(() => {
  const url = route.query.url as string
  return url || ''
})

// 获取favicon
const favicon = ref('')
const getFavicon = () => {
  try {
    const url = new URL(targetUrl.value)
    favicon.value = `${url.protocol}//${url.host}/favicon.ico`
  } catch (e) {
    favicon.value = ''
  }
}

// 倒计时（可选功能，默认关闭）
const countdown = ref(0) // 设为 0 禁用自动跳转，设为 5 则5秒后自动跳转
let countdownTimer: number | null = null

const startCountdown = () => {
  if (countdown.value > 0) {
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value === 0) {
        handleContinue()
      }
    }, 1000)
  }
}

const cancelCountdown = () => {
  countdown.value = 0
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 继续访问
const handleContinue = () => {
  if (targetUrl.value) {
    window.open(targetUrl.value, '_blank', 'noopener')
  }
}

// 返回
const handleReturn = () => {
  router.back()
}

const handleCardMouseMove = (event: MouseEvent) => {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  cardEffect.x = event.clientX - rect.left
  cardEffect.y = event.clientY - rect.top
  cardEffect.show = true
}

const handleCardMouseLeave = () => {
  cardEffect.show = false
}

onMounted(() => {
  if (!targetUrl.value) {
    router.replace('/')
    return
  }
  getFavicon()
  // 如果需要自动跳转，取消下面的注释
  // countdown.value = 5
  // startCountdown()
})

onUnmounted(() => {
  cancelCountdown()
})
</script>

<style scoped>
</style>
