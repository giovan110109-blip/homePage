<template>
  <div ref="mapContainer" class="w-full h-full rounded-lg overflow-hidden cursor-pointer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '@/composables/useTheme'
import lightMapStyleJson from '@/assets/mapStyles/chronoframe_light.json'
import darkMapStyleJson from '@/assets/mapStyles/chronoframe_dark.json'
import type { StyleSpecification } from 'maplibre-gl'

interface Props {
  latitude: number
  longitude: number
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 13
})

const router = useRouter()
const mapContainer = ref<HTMLDivElement>()
const map = ref<maplibregl.Map>()
const marker = ref<maplibregl.Marker>()
const { isDark } = useTheme()

const initMap = () => {
  if (!mapContainer.value) return

  const initialStyle = isDark.value ? darkMapStyleJson : lightMapStyleJson

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: initialStyle as any,
    center: [props.longitude, props.latitude],
    zoom: props.zoom,
    interactive: true
  })

  // 添加标记
  marker.value = new maplibregl.Marker({
    color: '#4F46E5' // indigo-600
  })
    .setLngLat([props.longitude, props.latitude])
    .addTo(map.value)

  // 点击地图跳转到 MapView
  map.value.on('click', () => {
    router.push('/map')
  })
}

watch(isDark, (newDarkMode) => {
  if (map.value) {
    const newStyle = newDarkMode ? darkMapStyleJson : lightMapStyleJson
    map.value.setStyle(newStyle as any)
  }
})

// 监听坐标变化
watch([() => props.latitude, () => props.longitude], ([newLat, newLng]) => {
  if (map.value && marker.value) {
    const newCenter: [number, number] = [newLng, newLat]
    map.value.setCenter(newCenter)
    marker.value.setLngLat(newCenter)
  }
})

onMounted(async () => {
  initMap()
})

onUnmounted(() => {
  if (marker.value) {
    marker.value.remove()
  }
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
:deep(.maplibregl-ctrl-attrib) {
  font-size: 10px;
  opacity: 0.6;
}

:deep(.maplibregl-ctrl-logo) {
  display: none;
}
</style>
