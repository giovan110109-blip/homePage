<template>
  <div class="relative w-full h-screen">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="w-full h-full"></div>

    <!-- 返回按钮 -->
    <div class="absolute top-4 left-4 z-10">
      <el-button
        class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
        @click="$router.back()"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        返回相册
      </el-button>
    </div>

    <!-- 照片预览面板 -->
    <div
      v-if="selectedLocation"
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl p-4 max-w-2xl w-full mx-4"
    >
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-semibold text-lg">{{ selectedLocation.city }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedLocation.count }} 张照片</p>
        </div>
        <el-button size="small" @click="selectedLocation = null">
          <X class="w-4 h-4" />
        </el-button>
      </div>

      <!-- 照片网格 -->
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
        <div
          v-for="photo in selectedLocation.photos"
          :key="photo._id"
          class="aspect-square cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
          @click="viewPhoto(photo)"
        >
          <LazyImage
            :src="photo.originalUrl"
            :alt="photo.title"
            :thumb-hash="photo.thumbnailHash"
            :width="photo.width || 1"
            :height="photo.height || 1"
          />
        </div>
      </div>
    </div>

    <!-- 照片详情对话框 -->
    <el-dialog
      v-model="photoDialogVisible"
      :title="currentPhoto?.title"
      width="90%"
      :style="{ maxWidth: '800px' }"
    >
      <div v-if="currentPhoto">
        <img
          :src="currentPhoto.originalUrl"
          :alt="currentPhoto.title"
          class="w-full rounded-lg mb-4"
        />
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500">拍摄时间</p>
            <p class="font-semibold">{{ formatDate(currentPhoto.dateTaken) }}</p>
          </div>
          <div v-if="currentPhoto.geoinfo">
            <p class="text-gray-500">位置</p>
            <p class="font-semibold">{{ currentPhoto.geoinfo.formatted }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ArrowLeft, MapPin, X } from 'lucide-vue-next'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import request from '@/api/request'
import { getAssetURL } from '@/utils'
import LazyImage from '@/components/LazyImage.vue'
import { useTheme } from '@/composables/useTheme'
import lightMapStyleJson from '@/assets/mapStyles/chronoframe_light.json'
import darkMapStyleJson from '@/assets/mapStyles/chronoframe_dark.json'
import type { StyleSpecification } from 'maplibre-gl'

interface MapLocation {
  city: string
  location: {
    latitude: number
    longitude: number
  }
  count: number
  photos: Array<{
    _id: string
    title: string
    originalUrl: string
    thumbnailHash?: string
    width?: number
    height?: number
    dateTaken: string
    geoinfo?: any
    isLive?: boolean
    videoUrl?: string
  }>
}

const mapContainer = ref<HTMLDivElement>()
const map = ref<maplibregl.Map>()
const mapData = ref<MapLocation[]>([])
const selectedLocation = ref<MapLocation | null>(null)
const photoDialogVisible = ref(false)
const currentPhoto = ref<any>(null)
const totalPhotos = ref(0)
const mapReady = ref(false)
const markers = ref<maplibregl.Marker[]>([])
const { isDark } = useTheme()

const initMap = () => {
  if (!mapContainer.value) return

  const initialStyle = isDark.value ? darkMapStyleJson : lightMapStyleJson

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: initialStyle as any,
    center: [104.066, 30.573], // 成都
    zoom: 4
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-right')
  map.value.addControl(new maplibregl.FullscreenControl(), 'top-right')

  map.value.on('load', () => {
    mapReady.value = true
    if (mapData.value.length > 0) {
      addMarkersToMap()
      fitMapBounds()
    }
  })

  map.value.on('style.load', () => {
    if (mapData.value.length > 0) {
      addMarkersToMap()
      fitMapBounds()
    }
  })
}

watch(isDark, (newDarkMode) => {
  if (map.value) {
    const newStyle = newDarkMode ? darkMapStyleJson : lightMapStyleJson
    map.value.setStyle(newStyle as any)
  }
})

const loadMapData = async () => {
  try {
    const res: any = await request.get('/photos/map/data')
    
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      // 处理每个location中每张photo的URL
      mapData.value = res.data.map((location: MapLocation) => ({
        ...location,
        photos: location.photos.map((photo: any) => ({
          ...photo,
          originalUrl: getAssetURL(photo.originalUrl)
        }))
      }))
      totalPhotos.value = res.data.reduce((sum: number, loc: MapLocation) => sum + loc.count, 0)
      
      if (mapReady.value) {
        addMarkersToMap()
        fitMapBounds()
      }
    }
  } catch (error: any) {
    console.error('加载地图数据失败:', error)
  }
}

const clearMarkers = () => {
  markers.value.forEach(marker => marker.remove())
  markers.value = []
}

const addMarkersToMap = () => {
  if (!map.value) return

  clearMarkers()

  mapData.value.forEach(location => {
    const longitude = Number(location.location?.longitude)
    const latitude = Number(location.location?.latitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return
    }
    // 创建标记元素
    const el = document.createElement('div')
    el.className = 'map-marker'

    const bubble = document.createElement('div')
    bubble.style.cssText = `
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.2s;
      transform: scale(1);
    `
    bubble.textContent = location.count.toString()
    el.appendChild(bubble)
    
    // 悬停效果
    el.addEventListener('mouseenter', () => {
      bubble.style.transform = 'scale(1.2)'
    })
    el.addEventListener('mouseleave', () => {
      bubble.style.transform = 'scale(1)'
    })

    // 创建标记
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map.value!)

    markers.value.push(marker)

    // 点击事件
    el.addEventListener('click', () => {
      selectedLocation.value = location
      
      // 飞到该位置
      map.value?.flyTo({
        center: [longitude, latitude],
        zoom: 12,
        duration: 1500
      })
    })
  })
}

const fitMapBounds = () => {
  if (!map.value || mapData.value.length === 0) return

  const bounds = new maplibregl.LngLatBounds()
  
  mapData.value.forEach(location => {
    const longitude = Number(location.location?.longitude)
    const latitude = Number(location.location?.latitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return
    }
    bounds.extend([longitude, latitude])
  })

  map.value.fitBounds(bounds, {
    padding: 100,
    duration: 1000
  })
}

const viewPhoto = (photo: any) => {
  currentPhoto.value = photo
  photoDialogVisible.value = true
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  initMap()
  await loadMapData()
})

onUnmounted(() => {
  map.value?.remove()
})
</script>

<style scoped>
:deep(.maplibregl-ctrl-attrib) {
  font-size: 10px;
}
</style>
