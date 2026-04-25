<template>
  <div class="relative w-full h-screen">
    <div ref="mapContainer" class="w-full h-full"></div>

    <div class="absolute top-4 left-4 z-10">
      <el-button
        class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
        @click="$router.back()"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        返回相册
      </el-button>
    </div>

    <PhotoViewer
      v-model="photoViewerVisible"
      :photos="currentLocationPhotos"
      :current-photo="currentPhoto"
      :show-info-panel="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, createApp, h } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRoute } from 'vue-router'
import request from '@/api/request'
import { getPhotoOriginalUrl } from '@/utils'
import PhotoViewer from '@/components/photo/PhotoViewer.vue'
import LazyImage from '@/components/photo/LazyImage.vue'
import { useTheme } from '@/composables/useTheme'

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

interface Photo {
  _id: string
  title: string
  originalUrl: string
  originalFileUrl?: string
  thumbnailHash?: string
  width?: number
  height?: number
  dateTaken: string
  geoinfo?: any
  isLive?: boolean
  videoUrl?: string
  exif?: any
}

interface MapLocation {
  city: string
  location: {
    latitude: number
    longitude: number
  }
  count: number
  photos: Photo[]
}

const mapContainer = ref<HTMLDivElement>()
const map = ref<mapboxgl.Map>()
const mapData = ref<MapLocation[]>([])
const photoViewerVisible = ref(false)
const currentPhoto = ref<Photo | null>(null)
const currentLocationPhotos = ref<Photo[]>([])
const totalPhotos = ref(0)
const mapReady = ref(false)
const currentPopup = ref<mapboxgl.Popup | null>(null)
const { isDark } = useTheme()
const route = useRoute()
const hasAppliedRouteFocus = ref(false)

const initMap = () => {
  if (!mapContainer.value) return

  const mapStyle = getMapStyle(isDark.value)

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: mapStyle,
    center: [104.066, 30.573],
    zoom: 4
  })

  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.value.addControl(new mapboxgl.FullscreenControl(), 'top-right')

  map.value.on('load', () => {
    mapReady.value = true
    if (mapData.value.length > 0) {
      addClusterLayer()
      fitMapBounds()
    }
  })

  map.value.on('style.load', () => {
    if (mapData.value.length > 0) {
      addClusterLayer()
      fitMapBounds()
    }
  })
}

watch(isDark, (newDarkMode) => {
  if (map.value) {
    const newStyle = getMapStyle(newDarkMode)
    map.value.setStyle(newStyle)
  }
})

const loadMapData = async () => {
  try {
    const res: any = await request.get('/photos/map/data')
    
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      mapData.value = res.data.map((location: MapLocation) => ({
        ...location,
        photos: location.photos.map((photo: any) => ({
          ...photo,
          originalUrl: photo.originalUrl
        }))
      }))
      totalPhotos.value = res.data.reduce((sum: number, loc: MapLocation) => sum + loc.count, 0)
      
      if (mapReady.value) {
        addClusterLayer()
        fitMapBounds()
      }
    }
  } catch (error: any) {
    console.error('加载地图数据失败:', error)
  }
}

const popupApps: any[] = []

const cleanupPopupApps = () => {
  popupApps.forEach(app => {
    try {
      app.unmount()
    } catch (e) {
      // ignore
    }
  })
  popupApps.length = 0
}

const createPhotoPopupContent = (location: MapLocation): HTMLElement => {
  const container = document.createElement('div')
  container.className = 'photo-popup'
  
  container.innerHTML = `
    <div class="popup-header">
      <div class="popup-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div class="popup-title">
        <div class="popup-city">${location.city}</div>
        <div class="popup-count">${location.photos?.length || location.count} 张照片</div>
      </div>
      <button class="popup-close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="popup-photos"></div>
  `

  const style = document.createElement('style')
  style.textContent = `
    .photo-popup {
      min-width: 280px;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .popup-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .popup-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .popup-title {
      flex: 1;
    }
    .popup-city {
      font-weight: 600;
      font-size: 14px;
    }
    .popup-count {
      font-size: 12px;
      opacity: 0.9;
    }
    .popup-close {
      width: 28px;
      height: 28px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: background 0.2s;
    }
    .popup-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .popup-photos {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
      padding: 10px;
      background: #f8fafc;
    }
    .popup-photo {
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .popup-photo:hover {
      transform: scale(1.05);
      z-index: 1;
    }
    .popup-more {
      aspect-ratio: 1;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 13px;
    }
    .mapboxgl-popup {
      max-width: none !important;
    }
    .mapboxgl-popup-content {
      padding: 0 !important;
      background: transparent !important;
      border-radius: 16px !important;
      box-shadow: none !important;
    }
    .mapboxgl-popup-tip {
      display: none !important;
    }
    .mapboxgl-popup-close-button {
      display: none !important;
    }
  `
  container.appendChild(style)

  const photosContainer = container.querySelector('.popup-photos')
  if (photosContainer && location.photos) {
    const photosToShow = location.photos.slice(0, 5)
    
    photosToShow.forEach((photo, index) => {
      const photoWrapper = document.createElement('div')
      photoWrapper.className = 'popup-photo'
      photoWrapper.setAttribute('data-index', String(index))
      photosContainer.appendChild(photoWrapper)

      const app = createApp({
        render() {
          return h(LazyImage, {
            src: getPhotoOriginalUrl(photo),
            alt: photo.title,
            thumbHash: photo.thumbnailHash,
            width: photo.width || 1,
            height: photo.height || 1,
          })
        }
      })
      app.mount(photoWrapper)
      popupApps.push(app)
    })

    if (location.photos.length > 5) {
      const moreDiv = document.createElement('div')
      moreDiv.className = 'popup-more'
      moreDiv.textContent = `+${location.photos.length - 5}`
      photosContainer.appendChild(moreDiv)
    }
  }

  container.querySelectorAll('.popup-photo').forEach((el, index) => {
    el.addEventListener('click', () => {
      if (location.photos?.[index]) {
        viewPhoto(location.photos[index], location.photos)
      }
    })
  })

  return container
}

const openLocationPopup = (location: MapLocation) => {
  if (!map.value) return

  const coordinates: [number, number] = [
    Number(location.location.longitude),
    Number(location.location.latitude),
  ]

  if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
    return
  }

  if (currentPopup.value) {
    currentPopup.value.remove()
    cleanupPopupApps()
  }

  const popupContent = createPhotoPopupContent(location)

  currentPopup.value = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -20],
    anchor: 'bottom'
  })
    .setLngLat(coordinates)
    .setDOMContent(popupContent)
    .addTo(map.value)

  popupContent.querySelector('.popup-close')?.addEventListener('click', () => {
    currentPopup.value?.remove()
    currentPopup.value = null
  })
}

const parseFocusQueryNumber = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const getRequestedFocus = () => {
  const photoId = Array.isArray(route.query.photoId)
    ? route.query.photoId[0]
    : route.query.photoId
  const latitude = parseFocusQueryNumber(route.query.lat)
  const longitude = parseFocusQueryNumber(route.query.lng)

  if (!photoId && (latitude === null || longitude === null)) {
    return null
  }

  return {
    photoId: typeof photoId === 'string' && photoId ? photoId : null,
    latitude,
    longitude,
  }
}

const findFocusLocation = () => {
  const requestedFocus = getRequestedFocus()
  if (!requestedFocus) return null

  if (requestedFocus.photoId) {
    const matchedByPhoto = mapData.value.find((location) =>
      location.photos?.some((photo) => photo._id === requestedFocus.photoId),
    )
    if (matchedByPhoto) return matchedByPhoto
  }

  if (
    requestedFocus.latitude === null ||
    requestedFocus.longitude === null
  ) {
    return null
  }

  return (
    mapData.value.find((location) => {
      const lat = Number(location.location?.latitude)
      const lng = Number(location.location?.longitude)
      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat - requestedFocus.latitude!) < 0.001 &&
        Math.abs(lng - requestedFocus.longitude!) < 0.001
      )
    }) || null
  )
}

const applyRouteFocus = async () => {
  if (!map.value || !mapReady.value || hasAppliedRouteFocus.value) return

  const targetLocation = findFocusLocation()
  if (!targetLocation) return

  hasAppliedRouteFocus.value = true

  const center: [number, number] = [
    Number(targetLocation.location.longitude),
    Number(targetLocation.location.latitude),
  ]

  map.value.easeTo({
    center,
    zoom: Math.max(map.value.getZoom(), 12),
    duration: 700,
  })

  await nextTick()
  window.setTimeout(() => {
    openLocationPopup(targetLocation)
  }, 260)
}

const addClusterLayer = () => {
  if (!map.value) return

  if (currentPopup.value) {
    currentPopup.value.remove()
    currentPopup.value = null
  }

  const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
    type: 'FeatureCollection',
    features: mapData.value
      .filter(location => {
        const lng = Number(location.location?.longitude)
        const lat = Number(location.location?.latitude)
        return Number.isFinite(lng) && Number.isFinite(lat)
      })
      .map((location, index) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [
            Number(location.location.longitude),
            Number(location.location.latitude)
          ]
        },
        properties: {
          id: index,
          city: location.city,
          count: location.count,
          photos: JSON.stringify(location.photos)
        }
      }))
  }

  const sourceId = 'photos-source'
  const clusterLayerId = 'clusters'
  const clusterCountLayerId = 'cluster-count'
  const unclusteredLayerId = 'unclustered-point'

  if (map.value.getLayer(clusterLayerId)) {
    map.value.removeLayer(clusterLayerId)
  }
  if (map.value.getLayer(clusterCountLayerId)) {
    map.value.removeLayer(clusterCountLayerId)
  }
  if (map.value.getLayer(unclusteredLayerId)) {
    map.value.removeLayer(unclusteredLayerId)
  }
  if (map.value.getSource(sourceId)) {
    map.value.removeSource(sourceId)
  }

  map.value.addSource(sourceId, {
    type: 'geojson',
    data: geojsonData,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 60
  })

  map.value.addLayer({
    id: clusterLayerId,
    type: 'circle',
    source: sourceId,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        'rgba(99, 102, 241, 0.9)',
        5,
        'rgba(139, 92, 246, 0.9)',
        15,
        'rgba(236, 72, 153, 0.9)'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        24,
        5,
        32,
        15,
        42
      ],
      'circle-stroke-width': 4,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
      'circle-blur': 0.1
    }
  })

  map.value.addLayer({
    id: clusterCountLayerId,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 15,
      'text-allow-overlap': true
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0, 0, 0, 0.3)',
      'text-halo-width': 1
    }
  })

  map.value.addLayer({
    id: unclusteredLayerId,
    type: 'circle',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': 'rgba(99, 102, 241, 0.9)',
      'circle-radius': 18,
      'circle-stroke-width': 4,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.9)',
      'circle-blur': 0.1
    }
  })

  map.value.on('click', clusterLayerId, (e) => {
    const features = map.value!.queryRenderedFeatures(e.point, {
      layers: [clusterLayerId]
    })
    const clusterId = features[0].properties.cluster_id
    ;(map.value!.getSource(sourceId) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
      clusterId,
      (err, zoom) => {
        if (err) return

        map.value!.easeTo({
          center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
          zoom: zoom,
          duration: 500
        })
      }
    )
  })

  map.value.on('click', unclusteredLayerId, (e) => {
    const properties = e.features?.[0]?.properties
    if (!properties) return

    const coordinates = (e.features?.[0]?.geometry as GeoJSON.Point)?.coordinates as [number, number]
    
    const location: MapLocation = {
      city: properties.city,
      location: {
        latitude: coordinates[1],
        longitude: coordinates[0]
      },
      count: properties.count,
      photos: JSON.parse(properties.photos)
    }

    openLocationPopup(location)
  })

  map.value.on('mouseenter', clusterLayerId, () => {
    map.value!.getCanvas().style.cursor = 'pointer'
  })
  map.value.on('mouseleave', clusterLayerId, () => {
    map.value!.getCanvas().style.cursor = ''
  })
  map.value.on('mouseenter', unclusteredLayerId, () => {
    map.value!.getCanvas().style.cursor = 'pointer'
  })
  map.value.on('mouseleave', unclusteredLayerId, () => {
    map.value!.getCanvas().style.cursor = ''
  })
}

const fitMapBounds = () => {
  if (!map.value || mapData.value.length === 0) return

  const bounds = new mapboxgl.LngLatBounds()
  
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

const viewPhoto = (photo: Photo, photos: Photo[]) => {
  currentPhoto.value = photo
  currentLocationPhotos.value = photos
  photoViewerVisible.value = true
}

onMounted(async () => {
  initMap()
  await loadMapData()
  await applyRouteFocus()
})

watch(
  () => [route.query.photoId, route.query.lat, route.query.lng],
  async () => {
    hasAppliedRouteFocus.value = false
    await applyRouteFocus()
  },
)

watch(
  () => [mapReady.value, mapData.value.length],
  async () => {
    await applyRouteFocus()
  },
)

onUnmounted(() => {
  cleanupPopupApps()
  currentPopup.value?.remove()
  map.value?.remove()
})
</script>

<style scoped>
:deep(.mapboxgl-ctrl-attrib) {
  font-size: 10px;
}
</style>
