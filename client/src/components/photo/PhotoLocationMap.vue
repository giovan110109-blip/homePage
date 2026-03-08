<template>
  <div ref="mapContainer" class="w-full h-full rounded-lg overflow-hidden cursor-pointer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTheme } from '@/composables/useTheme'

interface Props {
  latitude: number
  longitude: number
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 13
})

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

const getMapStyle = (isDark: boolean) => {
  if (MAPBOX_TOKEN) {
    const style = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
    return `${style}?language=zh`
  }
  return isDark 
    ? 'https://tiles.openfreemap.org/styles/dark'
    : 'https://tiles.openfreemap.org/styles/liberty'
}

const router = useRouter()
const mapContainer = ref<HTMLDivElement>()
const map = ref<mapboxgl.Map>()
const marker = ref<mapboxgl.Marker>()
const { isDark } = useTheme()

const initMap = () => {
  if (!mapContainer.value) return

  const initialStyle = getMapStyle(isDark.value)

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: initialStyle,
    center: [props.longitude, props.latitude],
    zoom: props.zoom,
    interactive: true
  })

  marker.value = new mapboxgl.Marker({
    color: '#4F46E5'
  })
    .setLngLat([props.longitude, props.latitude])
    .addTo(map.value)

  map.value.on('click', () => {
    router.push('/map')
  })
}

watch(isDark, (newDarkMode) => {
  if (map.value) {
    const newStyle = getMapStyle(newDarkMode)
    map.value.setStyle(newStyle)
  }
})

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
:deep(.mapboxgl-ctrl-attrib) {
  font-size: 10px;
  opacity: 0.6;
}

:deep(.mapboxgl-ctrl-logo) {
  display: none;
}
</style>
