<script setup lang="ts">
import { computed, createApp, h, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, Copy, Film, Images, MapPin, Sparkles, X } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import request from '@/api/request'
import PhotoViewer from '@/components/photo/PhotoViewer.vue'
import LazyImage from '@/components/photo/LazyImage.vue'
import { useTheme } from '@/composables/useTheme'
import { getPhotoOriginalUrl } from '@/utils'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

interface Photo {
  _id: string
  title?: string
  description?: string
  originalUrl: string
  originalFileUrl?: string
  thumbnailHash?: string
  width?: number
  height?: number
  dateTaken?: string
  geoinfo?: {
    country?: string
    region?: string
    city?: string
    locationName?: string
    formatted?: string
  }
  isLive?: boolean
  videoUrl?: string
  exif?: any
  camera?: {
    make?: string
    model?: string
    lens?: string
  }
}

interface MapLocation {
  id?: string
  city: string
  region?: string
  country?: string
  location: {
    latitude: number
    longitude: number
  }
  center?: [number, number]
  count: number
  liveCount?: number
  firstDate?: string
  lastDate?: string
  photos: Photo[]
}

type FilterMode = 'all' | 'live' | 'described'

const route = useRoute()
const router = useRouter()
const { isDark } = useTheme()

const mapContainer = ref<HTMLDivElement>()
const map = shallowRef<mapboxgl.Map>()
const mapData = ref<MapLocation[]>([])
const currentPopup = shallowRef<mapboxgl.Popup | null>(null)
const selectedLocation = ref<MapLocation | null>(null)
const currentLocationPhotos = ref<Photo[]>([])
const currentPhoto = ref<Photo | null>(null)
const popupApps: Array<{ unmount: () => void }> = []

const loading = shallowRef(true)
const loadError = shallowRef('')
const mapReady = shallowRef(false)
const photoViewerVisible = shallowRef(false)
const hasAppliedRouteFocus = shallowRef(false)
const filterYear = shallowRef('all')
const filterMonth = shallowRef('all')
const filterMode = shallowRef<FilterMode>('all')

const MAP_SOURCE_ID = 'travel-film-source'
const CLUSTER_LAYER_ID = 'travel-film-clusters'
const CLUSTER_COUNT_LAYER_ID = 'travel-film-cluster-count'
const UNCLUSTERED_LAYER_ID = 'travel-film-points'
let mapLayerHandlersBound = false

const getMapStyle = (dark: boolean) => {
  if (MAPBOX_TOKEN) {
    return `${dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}?language=zh`
  }
  return dark ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/liberty'
}

const getPhotoBoundaryDate = (photos: Photo[], mode: 'first' | 'last') => {
  const timestamps = photos
    .map((photo) => (photo.dateTaken ? new Date(photo.dateTaken).getTime() : NaN))
    .filter(Number.isFinite)
  if (!timestamps.length) return ''
  return new Date(mode === 'first' ? Math.min(...timestamps) : Math.max(...timestamps)).toISOString()
}

const normalizeLocation = (location: any): MapLocation | null => {
  const rawCenter = Array.isArray(location?.center) ? location.center : null
  const longitude = Number(location?.location?.longitude ?? rawCenter?.[0])
  const latitude = Number(location?.location?.latitude ?? rawCenter?.[1])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const photos = Array.isArray(location?.photos ?? location?.coverPhotos)
    ? (location.photos ?? location.coverPhotos).map((photo: any) => ({ ...photo }))
    : []
  const fallbackGeo = photos[0]?.geoinfo ?? {}
  const city = location?.city || fallbackGeo.city || fallbackGeo.locationName || '未知坐标'

  return {
    id: location?.id || `${city}-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
    city,
    region: location?.region || fallbackGeo.region,
    country: location?.country || fallbackGeo.country,
    location: { latitude, longitude },
    center: [longitude, latitude],
    count: Number(location?.count ?? photos.length),
    liveCount: Number(location?.liveCount ?? photos.filter((photo: Photo) => photo.isLive).length),
    firstDate: location?.firstDate ?? getPhotoBoundaryDate(photos, 'first'),
    lastDate: location?.lastDate ?? getPhotoBoundaryDate(photos, 'last'),
    photos,
  }
}

const getPhotoDate = (photo: Photo) => (photo.dateTaken ? new Date(photo.dateTaken) : null)

const years = computed(() => {
  const set = new Set<number>()
  mapData.value.forEach((location) => {
    location.photos.forEach((photo) => {
      const date = getPhotoDate(photo)
      if (date && !Number.isNaN(date.getTime())) set.add(date.getFullYear())
    })
  })
  return [...set].sort((a, b) => b - a)
})

const months = computed(() => {
  if (filterYear.value === 'all') return []
  const set = new Set<string>()
  mapData.value.forEach((location) => {
    location.photos.forEach((photo) => {
      const date = getPhotoDate(photo)
      if (!date || Number.isNaN(date.getTime())) return
      if (String(date.getFullYear()) === filterYear.value) {
        set.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
      }
    })
  })
  return [...set].sort((a, b) => b.localeCompare(a))
})

const filteredMapData = computed(() => {
  return mapData.value
    .map((location) => {
      const photos = location.photos.filter((photo) => {
        const date = getPhotoDate(photo)
        const yearMatched = filterYear.value === 'all' || (date && String(date.getFullYear()) === filterYear.value)
        const monthMatched = filterMonth.value === 'all' || (date && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === filterMonth.value)
        const modeMatched =
          filterMode.value === 'all' ||
          (filterMode.value === 'live' && photo.isLive) ||
          (filterMode.value === 'described' && Boolean(photo.description || photo.title))
        return Boolean(yearMatched && monthMatched && modeMatched)
      })

      if (!photos.length) return null
      return {
        ...location,
        photos,
        count: photos.length,
        liveCount: photos.filter((photo) => photo.isLive).length,
        firstDate: getPhotoBoundaryDate(photos, 'first'),
        lastDate: getPhotoBoundaryDate(photos, 'last'),
      }
    })
    .filter(Boolean) as MapLocation[]
})

const totalPhotos = computed(() => filteredMapData.value.reduce((sum, location) => sum + location.count, 0))
const totalPlaces = computed(() => filteredMapData.value.length)
const livePhotos = computed(() => filteredMapData.value.reduce((sum, location) => sum + (location.liveCount || 0), 0))
const latestDate = computed(() => {
  const timestamps = filteredMapData.value
    .map((location) => (location.lastDate ? new Date(location.lastDate).getTime() : NaN))
    .filter(Number.isFinite)
  return timestamps.length ? formatDate(new Date(Math.max(...timestamps)).toISOString()) : '暂无'
})

const activeFilterLabel = computed(() => {
  const parts = []
  if (filterYear.value !== 'all') parts.push(`${filterYear.value} 年`)
  if (filterMonth.value !== 'all') parts.push(filterMonth.value.replace('-', ' 年 ') + ' 月')
  if (filterMode.value === 'live') parts.push('Live Photo')
  if (filterMode.value === 'described') parts.push('有描述')
  return parts.length ? parts.join(' / ') : '全部胶卷'
})

const selectedTitle = computed(() => selectedLocation.value ? getLocationTitle(selectedLocation.value) : '')
const selectedTimeRange = computed(() => {
  const location = selectedLocation.value
  if (!location) return ''
  const first = formatDate(location.firstDate)
  const last = formatDate(location.lastDate)
  return first && last && first !== last ? `${first} - ${last}` : last || first || '时间未记录'
})
const selectedCamera = computed(() => {
  const camera = selectedLocation.value?.photos.find((photo) => photo.camera || photo.exif)?.camera
  if (camera?.make || camera?.model) return [camera.make, camera.model].filter(Boolean).join(' ')
  return '相机信息待显影'
})

const initMap = () => {
  if (!mapContainer.value) return

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: getMapStyle(isDark.value),
    center: [104.066, 30.573],
    zoom: 4,
  })

  map.value.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
  map.value.addControl(new mapboxgl.FullscreenControl(), 'top-right')

  map.value.on('load', () => {
    mapReady.value = true
    refreshMapLayers(true)
  })

  map.value.on('style.load', () => {
    refreshMapLayers(false)
  })

  map.value.on('click', (event) => {
    const features = map.value?.queryRenderedFeatures(event.point, {
      layers: [CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID],
    })
    if (!features?.length) closeCurrentPopup()
  })
}

const loadMapData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const res: any = await request.get('/photos/map/data')
    const rawData = Array.isArray(res?.data) ? res.data : []
    mapData.value = rawData.map(normalizeLocation).filter((location): location is MapLocation => Boolean(location))
    refreshMapLayers(true)
  } catch (error) {
    console.error('加载旅行胶卷地图失败:', error)
    loadError.value = '这部分暂时没有醒开，请稍后再试'
  } finally {
    loading.value = false
  }
}

const refreshMapLayers = (fitBoundsAfterUpdate: boolean) => {
  if (!map.value || !mapReady.value || !map.value.isStyleLoaded()) return
  addClusterLayer()
  if (fitBoundsAfterUpdate && !getRequestedFocus() && filteredMapData.value.length) fitMapBounds()
}

const cleanupPopupApps = () => {
  popupApps.splice(0).forEach((app) => {
    try {
      app.unmount()
    } catch (error) {
      console.warn('清理地图弹窗失败:', error)
    }
  })
}

const closeCurrentPopup = () => {
  currentPopup.value?.remove()
  currentPopup.value = null
  cleanupPopupApps()
}

const createPhotoPopupContent = (location: MapLocation) => {
  const container = document.createElement('div')
  container.className = 'film-popup-shell'

  const header = document.createElement('div')
  header.className = 'film-popup-header'
  header.innerHTML = `
    <div class="film-popup-kicker">TRAVEL NEGATIVE</div>
    <button class="film-popup-close" aria-label="关闭">×</button>
    <div class="film-popup-title">${escapeHtml(getLocationTitle(location))}</div>
    <div class="film-popup-meta">共 ${location.count} 张照片 · 最近一次 ${escapeHtml(formatDate(location.lastDate) || '时间未记录')}</div>
  `

  const strip = document.createElement('div')
  strip.className = 'film-popup-strip'
  location.photos.slice(0, 6).forEach((photo, index) => {
    const photoWrapper = document.createElement('button')
    photoWrapper.type = 'button'
    photoWrapper.className = `film-popup-photo${photo.isLive ? ' is-live' : ''}`
    photoWrapper.setAttribute('aria-label', photo.title || `照片 ${index + 1}`)
    strip.appendChild(photoWrapper)

    const app = createApp({
      render() {
        return h(LazyImage, {
          src: getPhotoOriginalUrl(photo),
          alt: photo.title || '旅行照片',
          thumbHash: photo.thumbnailHash,
          width: photo.width || 1,
          height: photo.height || 1,
        })
      },
    })
    app.mount(photoWrapper)
    popupApps.push(app)
    photoWrapper.addEventListener('click', () => viewPhoto(photo, location.photos))
  })

  const actions = document.createElement('div')
  actions.className = 'film-popup-actions'
  actions.innerHTML = `
    <button class="film-popup-action is-primary" data-action="drawer">查看全部</button>
    <button class="film-popup-action" data-action="gallery">进入相册</button>
  `

  container.append(header, strip, actions)
  container.querySelector('.film-popup-close')?.addEventListener('click', closeCurrentPopup)
  container.querySelector('[data-action="drawer"]')?.addEventListener('click', () => openPlaceDrawer(location))
  container.querySelector('[data-action="gallery"]')?.addEventListener('click', () => openGallery(location.photos[0]))
  return container
}

const openLocationPopup = (location: MapLocation) => {
  if (!map.value) return
  const coordinates: [number, number] = [Number(location.location.longitude), Number(location.location.latitude)]
  if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return

  closeCurrentPopup()
  selectedLocation.value = location

  currentPopup.value = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -20],
    anchor: 'bottom',
  })
    .setLngLat(coordinates)
    .setDOMContent(createPhotoPopupContent(location))
    .addTo(map.value)

  currentPopup.value.on('close', () => {
    currentPopup.value = null
    cleanupPopupApps()
  })
}

const openPlaceDrawer = (location: MapLocation) => {
  selectedLocation.value = location
}

const closePlaceDrawer = () => {
  selectedLocation.value = null
}

const parseFocusQueryNumber = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const getRequestedFocus = () => {
  const photoIdQuery = route.query.photo ?? route.query.photoId
  const photoId = Array.isArray(photoIdQuery) ? photoIdQuery[0] : photoIdQuery
  const latitude = parseFocusQueryNumber(route.query.lat)
  const longitude = parseFocusQueryNumber(route.query.lng)
  if (!photoId && (latitude === null || longitude === null)) return null
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
    const matched = filteredMapData.value.find((location) =>
      location.photos.some((photo) => photo._id === requestedFocus.photoId),
    )
    if (matched) return matched
  }

  if (requestedFocus.latitude === null || requestedFocus.longitude === null) return null
  return filteredMapData.value.find((location) => {
    const lat = Number(location.location.latitude)
    const lng = Number(location.location.longitude)
    return Math.abs(lat - requestedFocus.latitude!) < 0.001 && Math.abs(lng - requestedFocus.longitude!) < 0.001
  }) || null
}

const applyRouteFocus = async () => {
  if (!map.value || !mapReady.value || hasAppliedRouteFocus.value) return
  const targetLocation = findFocusLocation()
  if (!targetLocation) return

  hasAppliedRouteFocus.value = true
  map.value.easeTo({
    center: [Number(targetLocation.location.longitude), Number(targetLocation.location.latitude)],
    zoom: Math.max(map.value.getZoom(), 12),
    duration: 900,
  })

  await nextTick()
  window.setTimeout(() => openLocationPopup(targetLocation), 320)
}

const handleClusterClick = (event: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
  if (!map.value) return
  const feature = event.features?.[0]
  const clusterId = feature?.properties?.cluster_id
  if (clusterId === undefined) return

  ;(map.value.getSource(MAP_SOURCE_ID) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
    if (err || !map.value) return
    map.value.easeTo({
      center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
      zoom,
      duration: 620,
    })
  })
}

const handleUnclusteredPointClick = (event: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
  const feature = event.features?.[0]
  const properties = feature?.properties
  if (!properties) return

  const location = filteredMapData.value.find((item) => item.id === properties.locationId)
  if (location) openLocationPopup(location)
}

const handleLayerMouseEnter = () => {
  if (map.value) map.value.getCanvas().style.cursor = 'pointer'
}

const handleLayerMouseLeave = () => {
  if (map.value) map.value.getCanvas().style.cursor = ''
}

const removeMapLayerHandlers = () => {
  if (!map.value || !mapLayerHandlersBound) return
  map.value.off('click', CLUSTER_LAYER_ID, handleClusterClick)
  map.value.off('click', UNCLUSTERED_LAYER_ID, handleUnclusteredPointClick)
  map.value.off('mouseenter', CLUSTER_LAYER_ID, handleLayerMouseEnter)
  map.value.off('mouseleave', CLUSTER_LAYER_ID, handleLayerMouseLeave)
  map.value.off('mouseenter', UNCLUSTERED_LAYER_ID, handleLayerMouseEnter)
  map.value.off('mouseleave', UNCLUSTERED_LAYER_ID, handleLayerMouseLeave)
  mapLayerHandlersBound = false
}

const addMapLayerHandlers = () => {
  if (!map.value) return
  removeMapLayerHandlers()
  map.value.on('click', CLUSTER_LAYER_ID, handleClusterClick)
  map.value.on('click', UNCLUSTERED_LAYER_ID, handleUnclusteredPointClick)
  map.value.on('mouseenter', CLUSTER_LAYER_ID, handleLayerMouseEnter)
  map.value.on('mouseleave', CLUSTER_LAYER_ID, handleLayerMouseLeave)
  map.value.on('mouseenter', UNCLUSTERED_LAYER_ID, handleLayerMouseEnter)
  map.value.on('mouseleave', UNCLUSTERED_LAYER_ID, handleLayerMouseLeave)
  mapLayerHandlersBound = true
}

const addClusterLayer = () => {
  if (!map.value || !mapReady.value || !map.value.isStyleLoaded()) return
  closeCurrentPopup()

  removeMapLayerHandlers()
  ;[CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID, UNCLUSTERED_LAYER_ID].forEach((layerId) => {
    if (map.value?.getLayer(layerId)) map.value.removeLayer(layerId)
  })
  if (map.value.getSource(MAP_SOURCE_ID)) map.value.removeSource(MAP_SOURCE_ID)

  const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: 'FeatureCollection',
    features: filteredMapData.value.map((location) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(location.location.longitude), Number(location.location.latitude)],
      },
      properties: {
        locationId: location.id,
        city: location.city,
        count: location.count,
        liveCount: location.liveCount || 0,
      },
    })),
  }

  map.value.addSource(MAP_SOURCE_ID, {
    type: 'geojson',
    data: geojsonData,
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 58,
  })

  const pointPalette = isDark.value
    ? {
        low: '#9fcae4',
        mid: '#78aecd',
        high: '#c5e1f1',
        live: '#9fcae4',
        stroke: 'rgba(229, 238, 249, 0.76)',
        text: '#08111f',
        halo: 'rgba(229, 238, 249, 0.46)',
      }
    : {
        low: '#78aecd',
        mid: '#5f98ba',
        high: '#3f7898',
        live: '#5f98ba',
        stroke: 'rgba(255, 255, 255, 0.82)',
        text: '#ffffff',
        halo: 'rgba(15, 23, 42, 0.28)',
      }

  map.value.addLayer({
    id: CLUSTER_LAYER_ID,
    type: 'circle',
    source: MAP_SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], pointPalette.low, 5, pointPalette.mid, 15, pointPalette.high],
      'circle-radius': ['step', ['get', 'point_count'], 23, 5, 31, 15, 42],
      'circle-stroke-width': 7,
      'circle-stroke-color': pointPalette.stroke,
      'circle-blur': 0.05,
    },
  })

  map.value.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: MAP_SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 14,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': pointPalette.text,
      'text-halo-color': pointPalette.halo,
      'text-halo-width': 1,
    },
  })

  map.value.addLayer({
    id: UNCLUSTERED_LAYER_ID,
    type: 'circle',
    source: MAP_SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['case', ['>', ['get', 'liveCount'], 0], pointPalette.live, pointPalette.low],
      'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 15, 12, 24, 36, 34],
      'circle-stroke-width': 5,
      'circle-stroke-color': pointPalette.stroke,
      'circle-opacity': 0.94,
    },
  })

  addMapLayerHandlers()
}

const fitMapBounds = () => {
  if (!map.value || !filteredMapData.value.length) return
  const bounds = new mapboxgl.LngLatBounds()
  filteredMapData.value.forEach((location) => bounds.extend([Number(location.location.longitude), Number(location.location.latitude)]))
  map.value.fitBounds(bounds, { padding: 120, maxZoom: 10, duration: 1000 })
}

const viewPhoto = (photo: Photo, photos: Photo[]) => {
  currentPhoto.value = photo
  currentLocationPhotos.value = photos
  photoViewerVisible.value = true
}

const openGallery = (photo?: Photo) => {
  router.push({ path: '/gallery', query: photo?._id ? { photo: photo._id } : undefined })
}

const copyPlaceLink = async () => {
  if (!selectedLocation.value) return
  const { latitude, longitude } = selectedLocation.value.location
  const url = `${window.location.origin}${window.location.pathname}#/travel?lat=${latitude}&lng=${longitude}`
  await navigator.clipboard?.writeText(url)
  ElMessage.success('地点链接已复制')
}

const resetFilters = () => {
  filterYear.value = 'all'
  filterMonth.value = 'all'
  filterMode.value = 'all'
}

const getLocationTitle = (location: MapLocation) => {
  return [location.city, location.region || location.country].filter(Boolean).join(' / ')
}

const formatDate = (date?: string) => {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] || char)

watch(isDark, (dark) => {
  if (!map.value) return
  map.value.setStyle(getMapStyle(dark))
})

watch(filterYear, () => {
  filterMonth.value = 'all'
})

watch([filteredMapData, filterYear, filterMonth, filterMode], async () => {
  refreshMapLayers(false)
  hasAppliedRouteFocus.value = false
  await applyRouteFocus()
})

watch(
  () => [route.query.photo, route.query.photoId, route.query.lat, route.query.lng],
  async () => {
    hasAppliedRouteFocus.value = false
    await applyRouteFocus()
  },
)

watch(
  () => [mapReady.value, filteredMapData.value.length],
  async () => {
    await applyRouteFocus()
  },
)

onMounted(async () => {
  initMap()
  await loadMapData()
  await applyRouteFocus()
})

onUnmounted(() => {
  removeMapLayerHandlers()
  closeCurrentPopup()
  map.value?.remove()
})
</script>

<template>
  <div class="travel-map-page">
    <div ref="mapContainer" class="travel-map-canvas"></div>

    <section class="travel-map-hero">
      <div class="travel-hero-copy">
        <span class="travel-kicker"><Film class="h-4 w-4" /> TRAVEL FILM MAP</span>
        <h1 class="travel-title">旅行胶卷地图</h1>
        <p class="travel-subtitle">每一个坐标，都是一卷还没完全醒开的胶片。</p>
      </div>
      <div class="travel-stats">
        <div><strong>{{ totalPlaces }}</strong><span>地点</span></div>
        <div><strong>{{ totalPhotos }}</strong><span>照片</span></div>
        <div><strong>{{ livePhotos }}</strong><span>Live</span></div>
        <div><strong>{{ latestDate }}</strong><span>最近</span></div>
      </div>
    </section>

    <div v-if="loading" class="travel-state">正在显影...</div>
    <div v-else-if="loadError" class="travel-state is-error">{{ loadError }}</div>
    <div v-else-if="!filteredMapData.length" class="travel-state">这个时间段还没有被冲洗出来</div>

    <aside v-if="selectedLocation" class="place-drawer" aria-label="地点详情">
      <div class="place-drawer-header">
        <div>
          <span class="travel-kicker"><Sparkles class="h-4 w-4" /> PLACE DOSSIER</span>
          <h2>{{ selectedTitle }}</h2>
          <p>{{ selectedTimeRange }}</p>
        </div>
        <button class="place-close" type="button" aria-label="关闭地点详情" @click="closePlaceDrawer">
          <X class="h-5 w-5" />
        </button>
      </div>

      <div class="place-story">
        这里保存了 {{ selectedLocation.count }} 张照片，最近一次停留在 {{ formatDate(selectedLocation.lastDate) || '未知日期' }}。
      </div>

      <div class="place-meta-grid">
        <div><Camera class="h-4 w-4" /><span>主要相机</span><strong>{{ selectedCamera }}</strong></div>
        <div><Film class="h-4 w-4" /><span>Live Photo</span><strong>{{ selectedLocation.liveCount || 0 }} 张</strong></div>
        <div><Images class="h-4 w-4" /><span>胶卷数量</span><strong>{{ selectedLocation.count }} 张</strong></div>
      </div>

      <div class="place-film-strip">
        <button
          v-for="photo in selectedLocation.photos.slice(0, 6)"
          :key="photo._id"
          class="place-film-frame"
          :class="{ 'is-live': photo.isLive }"
          type="button"
          @click="viewPhoto(photo, selectedLocation.photos)"
        >
          <LazyImage
            :src="getPhotoOriginalUrl(photo)"
            :alt="photo.title || '旅行照片'"
            :thumb-hash="photo.thumbnailHash"
            :width="photo.width || 1"
            :height="photo.height || 1"
          />
        </button>
      </div>

      <div class="place-photo-grid">
        <button
          v-for="photo in selectedLocation.photos"
          :key="photo._id"
          class="place-photo-card"
          type="button"
          @click="viewPhoto(photo, selectedLocation.photos)"
        >
          <LazyImage
            :src="getPhotoOriginalUrl(photo)"
            :alt="photo.title || '地点照片'"
            :thumb-hash="photo.thumbnailHash"
            :width="photo.width || 1"
            :height="photo.height || 1"
          />
          <span v-if="photo.isLive">LIVE</span>
        </button>
      </div>

      <div class="place-actions">
        <button type="button" @click="copyPlaceLink"><Copy class="h-4 w-4" />复制地点链接</button>
        <button type="button" @click="openGallery(selectedLocation.photos[0])"><Images class="h-4 w-4" />打开相册</button>
      </div>
    </aside>

    <PhotoViewer
      v-model="photoViewerVisible"
      :photos="currentLocationPhotos"
      :current-photo="currentPhoto"
      :show-info-panel="false"
    />
  </div>
</template>

<style scoped>
.travel-map-page {
  --film-ink: var(--theme-text-primary);
  --film-muted: var(--theme-text-muted);
  --film-paper: color-mix(in srgb, var(--theme-surface-strong) 86%, transparent);
  --film-paper-soft: color-mix(in srgb, var(--theme-surface-soft) 76%, transparent);
  --film-line: var(--theme-border);
  --film-line-strong: var(--theme-border-strong);
  --film-red: var(--theme-accent-strong);
  --film-gold: var(--theme-accent);
  --film-button: color-mix(in srgb, var(--theme-surface-soft) 74%, transparent);
  --film-shadow: var(--theme-shadow-lg);
  position: relative;
  width: 100%;
  height: calc(100vh - 64px);
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 8%, color-mix(in srgb, var(--theme-accent) 18%, transparent), transparent 30%),
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--theme-accent-strong) 10%, transparent), transparent 28%),
    var(--theme-page-gradient);
}

:global(.dark) .travel-map-page {
  --film-paper: color-mix(in srgb, var(--theme-surface-strong) 78%, transparent);
  --film-paper-soft: color-mix(in srgb, var(--theme-surface-soft) 62%, transparent);
  --film-button: color-mix(in srgb, var(--theme-surface-soft) 58%, transparent);
}

.travel-map-canvas {
  position: absolute;
  inset: 0;
}

.travel-map-page::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--theme-bg) 26%, transparent), transparent 16%, transparent 84%, color-mix(in srgb, var(--theme-bg) 28%, transparent)),
    repeating-linear-gradient(0deg, color-mix(in srgb, var(--theme-accent) 4%, transparent) 0 1px, transparent 1px 5px);
  mix-blend-mode: soft-light;
}

.travel-map-hero,
.travel-toolbar,
.travel-state,
.place-drawer {
  position: absolute;
  z-index: 5;
}

.travel-map-hero {
  top: 18px;
  left: 18px;
  width: min(430px, calc(100vw - 36px));
  padding: 18px;
  color: var(--film-ink);
  background: var(--film-paper);
  border: 1px solid var(--film-line);
  border-radius: 28px;
  box-shadow: var(--film-shadow);
  backdrop-filter: blur(20px);
  animation: revealPanel 0.7s ease both;
}

.travel-back,
.travel-reset,
.travel-select,
.travel-segmented button,
.place-actions button,
.place-close {
  border: 1px solid var(--film-line);
  color: var(--film-ink);
  background: var(--film-button);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.travel-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
}

.travel-back:hover,
.travel-reset:hover,
.place-actions button:hover,
.place-close:hover {
  transform: translateY(-1px);
  background: var(--theme-accent-soft);
  border-color: color-mix(in srgb, var(--theme-accent) 42%, var(--film-line));
}

.travel-hero-copy {
  margin-top: 0;
}

.travel-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--film-red);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.travel-title {
  margin: 8px 0 6px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(34px, 6vw, 54px);
  line-height: 0.94;
  letter-spacing: -0.06em;
}

.travel-subtitle {
  margin: 0;
  color: var(--film-muted);
  font-size: 14px;
}

.travel-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 18px;
}

.travel-stats div {
  padding: 10px 8px;
  border-radius: 16px;
  background: var(--film-paper-soft);
  border: 1px dashed var(--film-line);
}

.travel-stats strong,
.travel-stats span {
  display: block;
}

.travel-stats strong {
  font-size: 18px;
  line-height: 1;
}

.travel-stats span {
  margin-top: 5px;
  font-size: 11px;
  opacity: 0.66;
}

.travel-toolbar {
  right: 18px;
  top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(760px, calc(100vw - 486px));
  padding: 12px;
  border: 1px solid var(--film-line);
  border-radius: 22px;
  color: var(--film-ink);
  background: var(--film-paper);
  box-shadow: var(--theme-shadow-md);
  backdrop-filter: blur(20px);
  animation: revealPanel 0.8s 0.08s ease both;
}

.travel-filter-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 120px;
  font-size: 13px;
  font-weight: 700;
}

.travel-select {
  min-width: 118px;
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  outline: none;
}

.travel-select:disabled {
  opacity: 0.46;
}

.travel-segmented {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--film-paper-soft);
}

.travel-segmented button {
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
}

.travel-segmented button.active {
  color: var(--theme-bg-elevated);
  background: linear-gradient(135deg, var(--film-red), var(--film-gold));
  border-color: transparent;
}

.travel-reset {
  height: 38px;
  padding: 0 13px;
  border-radius: 999px;
  font-size: 13px;
}

.travel-state {
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  padding: 12px 18px;
  border: 1px solid var(--film-line);
  border-radius: 999px;
  color: var(--film-ink);
  background: var(--film-paper);
  box-shadow: var(--theme-shadow-sm);
}

.travel-state.is-error {
  color: var(--theme-text-primary);
  background: var(--theme-danger-soft);
}

.place-drawer {
  right: 18px;
  bottom: 18px;
  width: min(480px, calc(100vw - 36px));
  max-height: min(72vh, 720px);
  overflow: auto;
  padding: 18px;
  color: var(--film-ink);
  background: var(--film-paper);
  border: 1px solid var(--film-line);
  border-radius: 28px;
  box-shadow: var(--film-shadow);
  backdrop-filter: blur(24px);
  animation: drawerIn 0.46s cubic-bezier(.2,.75,.2,1) both;
}

.place-drawer-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.place-drawer-header h2 {
  margin: 8px 0 4px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  line-height: 1;
}

.place-drawer-header p {
  margin: 0;
  color: var(--film-muted);
  font-size: 13px;
}

.place-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
}

.place-story {
  margin: 16px 0;
  padding: 14px;
  border-radius: 18px;
  color: var(--film-muted);
  background: var(--film-paper-soft);
  border: 1px dashed var(--film-line);
  font-size: 14px;
  line-height: 1.75;
}

.place-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.place-meta-grid div {
  min-width: 0;
  padding: 12px;
  border-radius: 18px;
  background: var(--film-paper-soft);
  border: 1px solid var(--film-line);
}

.place-meta-grid svg,
.place-meta-grid span,
.place-meta-grid strong {
  display: block;
}

.place-meta-grid span {
  margin-top: 8px;
  font-size: 11px;
  opacity: 0.62;
}

.place-meta-grid strong {
  margin-top: 3px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-film-strip {
  display: flex;
  gap: 10px;
  margin: 18px -18px 16px;
  padding: 14px 18px;
  overflow-x: auto;
  background: color-mix(in srgb, var(--theme-bg-elevated) 72%, #111827 28%);
}

.place-film-frame {
  position: relative;
  flex: 0 0 92px;
  height: 92px;
  overflow: hidden;
  border: 4px solid color-mix(in srgb, var(--theme-accent) 34%, var(--theme-bg-elevated));
  border-radius: 16px;
  background: color-mix(in srgb, var(--theme-bg) 70%, #111827 30%);
}

.place-film-frame.is-live::after,
.place-photo-card span {
  content: 'LIVE';
  position: absolute;
  right: 6px;
  top: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  color: var(--theme-bg-elevated);
  background: var(--theme-accent-strong);
  font-size: 10px;
  font-weight: 800;
  animation: liveBreath 1.8s ease-in-out infinite;
}

.place-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.place-photo-card {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--film-line);
  border-radius: 16px;
  background: var(--film-paper-soft);
}

.place-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.place-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 160px;
  min-height: 42px;
  border-radius: 999px;
  font-weight: 700;
}

:deep(.mapboxgl-ctrl-attrib) {
  font-size: 10px;
}

:deep(.mapboxgl-popup) {
  max-width: none !important;
}

:deep(.mapboxgl-popup-content) {
  padding: 0 !important;
  background: transparent !important;
  border-radius: 22px !important;
  box-shadow: none !important;
}

:deep(.mapboxgl-popup-tip),
:deep(.mapboxgl-popup-close-button) {
  display: none !important;
}

:deep(.film-popup-shell) {
  width: min(356px, calc(100vw - 32px));
  overflow: hidden;
  color: var(--film-ink);
  background: var(--film-paper);
  border: 1px solid var(--film-line);
  border-radius: 24px;
  box-shadow: var(--film-shadow);
  backdrop-filter: blur(20px);
  animation: drawerIn 0.42s ease both;
}

:deep(.film-popup-header) {
  position: relative;
  padding: 16px 18px 14px;
  background:
    radial-gradient(circle at 20% 0%, var(--theme-accent-soft), transparent 40%),
    linear-gradient(135deg, var(--film-paper), var(--film-paper-soft));
}

:deep(.film-popup-kicker) {
  color: var(--film-red);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

:deep(.film-popup-title) {
  margin-top: 5px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.05;
}

:deep(.film-popup-meta) {
  margin-top: 7px;
  color: var(--film-muted);
  font-size: 12px;
}

:deep(.film-popup-close) {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 30px;
  height: 30px;
  border: 1px solid var(--film-line);
  border-radius: 999px;
  background: var(--film-button);
  font-size: 20px;
  line-height: 1;
}

:deep(.film-popup-strip) {
  display: flex;
  gap: 8px;
  padding: 14px;
  overflow-x: auto;
  background:
    linear-gradient(90deg, transparent 0 8px, color-mix(in srgb, var(--theme-bg-elevated) 22%, transparent) 8px 15px, transparent 15px 24px),
    color-mix(in srgb, var(--theme-bg) 72%, #111827 28%);
}

:deep(.film-popup-photo) {
  position: relative;
  flex: 0 0 68px;
  height: 68px;
  overflow: hidden;
  border: 3px solid color-mix(in srgb, var(--theme-accent) 34%, var(--theme-bg-elevated));
  border-radius: 13px;
  background: color-mix(in srgb, var(--theme-bg) 76%, #111827 24%);
  transition: transform 180ms ease;
}

:deep(.film-popup-photo:hover) {
  transform: translateY(-2px) scale(1.04);
}

:deep(.film-popup-photo.is-live::after) {
  content: 'LIVE';
  position: absolute;
  right: 4px;
  top: 4px;
  padding: 1px 5px;
  border-radius: 999px;
  color: var(--theme-bg-elevated);
  background: var(--theme-accent-strong);
  font-size: 9px;
  font-weight: 900;
  animation: liveBreath 1.8s ease-in-out infinite;
}

:deep(.film-popup-actions) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
}

:deep(.film-popup-action) {
  min-height: 38px;
  border: 1px solid var(--film-line);
  border-radius: 999px;
  color: var(--film-ink);
  background: var(--film-button);
  font-weight: 800;
}

:deep(.film-popup-action.is-primary) {
  color: var(--theme-bg-elevated);
  background: linear-gradient(135deg, var(--film-red), var(--film-gold));
  border-color: transparent;
}

@keyframes revealPanel {
  from { opacity: 0; transform: translateY(-14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes drawerIn {
  from { opacity: 0; transform: translateY(22px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes liveBreath {
  0%, 100% { box-shadow: 0 0 0 color-mix(in srgb, var(--theme-accent) 0%, transparent); }
  50% { box-shadow: 0 0 18px color-mix(in srgb, var(--theme-accent) 48%, transparent); }
}

@media (max-width: 1024px) {
  .travel-toolbar {
    top: auto;
    right: 14px;
    left: 14px;
    bottom: 14px;
    max-width: none;
    flex-wrap: wrap;
  }

  .travel-state {
    bottom: 120px;
  }
}

@media (max-width: 768px) {
  .travel-map-hero {
    top: 12px;
    left: 12px;
    width: calc(100vw - 24px);
    padding: 14px;
    border-radius: 22px;
  }

  .travel-title {
    font-size: 34px;
  }

  .travel-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .travel-toolbar {
    gap: 8px;
    padding: 10px;
  }

  .travel-filter-label,
  .travel-select,
  .travel-segmented,
  .travel-reset {
    width: 100%;
  }

  .travel-segmented button {
    flex: 1;
  }

  .place-drawer {
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 72vh;
    border-radius: 28px 28px 0 0;
  }

  .place-meta-grid,
  .place-photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .travel-map-hero,
  .travel-toolbar,
  .place-drawer,
  :deep(.film-popup-shell),
  .place-film-frame.is-live::after,
  .place-photo-card span,
  :deep(.film-popup-photo.is-live::after) {
    animation: none;
  }
}
</style>
