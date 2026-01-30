<template>
  <div 
    ref="containerRef" 
    :class="className" 
    class="dot-grid-canvas"
  >
    <canvas 
      ref="canvasRef" 
      :width="canvasWidth" 
      :height="canvasHeight"
      class="absolute inset-0 pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'

interface Props {
  dotSize?: number
  gap?: number
  baseColor?: string
  activeColor?: string
  proximity?: number
  speedTrigger?: number
  shockRadius?: number
  shockStrength?: number
  maxSpeed?: number
  resistance?: number
  returnDuration?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  dotSize: 16,
  gap: 32,
  baseColor: '#27FF64',
  activeColor: '#27FF64',
  proximity: 150,
  speedTrigger: 100,
  shockRadius: 250,
  shockStrength: 5,
  maxSpeed: 5000,
  resistance: 750,
  returnDuration: 1.5,
  className: ''
})

const containerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const mousePos = ref({ x: 0, y: 0 })
const isMouseInside = ref(false)

interface Dot {
  x: number
  y: number
  originalX: number
  originalY: number
  vx: number
  vy: number
  size: number
  opacity: number
}

const dots = ref<Dot[]>([])
let animationId: number

const initCanvas = () => {
  if (!containerRef.value || !canvasRef.value) return
  
  // 使用window尺寸确保覆盖整个屏幕
  canvasWidth.value = window.innerWidth
  canvasHeight.value = window.innerHeight
  
  // 创建点阵，确保覆盖整个屏幕
  dots.value = []
  const cols = Math.ceil(canvasWidth.value / props.gap) + 2
  const rows = Math.ceil(canvasHeight.value / props.gap) + 2
  
  for (let i = -1; i < rows; i++) {
    for (let j = -1; j < cols; j++) {
      const x = j * props.gap + props.gap / 2
      const y = i * props.gap + props.gap / 2
      
      dots.value.push({
        x,
        y,
        originalX: x,
        originalY: y,
        vx: 0,
        vy: 0,
        size: props.dotSize,
        opacity: 0.3
      })
    }
  }
}

const animate = () => {
  if (!canvasRef.value) return
  
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  dots.value.forEach(dot => {
    // 计算与鼠标的距离
    const dx = mousePos.value.x - dot.x
    const dy = mousePos.value.y - dot.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (isMouseInside.value && distance < props.proximity) {
      // 鼠标靠近时的效果
      const force = (props.proximity - distance) / props.proximity
      const angle = Math.atan2(dy, dx)
      
      // 添加排斥力
      dot.vx -= Math.cos(angle) * force * props.shockStrength
      dot.vy -= Math.sin(angle) * force * props.shockStrength
      
      // 限制最大速度
      const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy)
      if (speed > props.maxSpeed / 1000) {
        dot.vx = (dot.vx / speed) * (props.maxSpeed / 1000)
        dot.vy = (dot.vy / speed) * (props.maxSpeed / 1000)
      }
      
      dot.opacity = Math.min(1, 0.3 + force * 0.7)
    } else {
      // 回归原位
      const returnForceX = (dot.originalX - dot.x) * 0.1
      const returnForceY = (dot.originalY - dot.y) * 0.1
      
      dot.vx += returnForceX
      dot.vy += returnForceY
      
      dot.opacity = Math.max(0.1, dot.opacity - 0.02)
    }
    
    // 应用阻力
    dot.vx *= 1 - props.resistance / 10000
    dot.vy *= 1 - props.resistance / 10000
    
    // 更新位置
    dot.x += dot.vx
    dot.y += dot.vy
    
    // 绘制点
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, dot.size / 2, 0, Math.PI * 2)
    ctx.fillStyle = `${props.activeColor}${Math.floor(dot.opacity * 255).toString(16).padStart(2, '0')}`
    ctx.fill()
  })
  
  animationId = requestAnimationFrame(animate)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  mousePos.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  isMouseInside.value = true
}

const handleMouseLeave = () => {
  isMouseInside.value = false
}

// 暴露方法供外部调用
defineExpose({
  handleMouseMove,
  handleMouseLeave
})



onMounted(() => {
  nextTick(() => {
    initCanvas()
    animate()
    
    // 监听窗口大小变化
    window.addEventListener('resize', initCanvas)
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', initCanvas)
})

watch([() => props.dotSize, () => props.gap], () => {
  initCanvas()
})
</script>

<style scoped>
.dot-grid-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

canvas {
  display: block;
}
</style>