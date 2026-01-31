<template>
  <div ref="mapContainer" class="w-full h-full rounded-lg overflow-hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Props {
  latitude: number
  longitude: number
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 13
})

const mapContainer = ref<HTMLDivElement>()
const map = ref<maplibregl.Map>()
const marker = ref<maplibregl.Marker>()

const initMap = () => {
  if (!mapContainer.value) return

  // 使用 OpenStreetMap 瓦片
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap'
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
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

  // 添加缩放和旋转控制
  map.value.addControl(new maplibregl.NavigationControl({
    showCompass: false
  }), 'top-right')
}

// 监听坐标变化
watch([() => props.latitude, () => props.longitude], ([newLat, newLng]) => {
  if (map.value && marker.value) {
    const newCenter: [number, number] = [newLng, newLat]
    map.value.setCenter(newCenter)
    marker.value.setLngLat(newCenter)
  }
})

onMounted(() => {
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
