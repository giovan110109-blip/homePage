<template>
  <div class="min-h-screen bg-black">
    <div class="w-full h-full">
      <!-- 瀑布流照片墙 -->
      <MasonryWall
        v-if="!loading && photos.length > 0"
        :items="photos"
        :column-width="columnWidth"
        :gap="gridGap"
        :min-columns="minColumns"
        :max-columns="maxColumns"
        :key-mapper="keyMapper"
        class="masonry p-1 sm:p-2"
      >
        <template #default="{ item: photo }">
          <div
            class="group cursor-pointer"
            @click="viewPhoto(photo)"
          >
            <div class="relative overflow-hidden rounded-md shadow-lg transition-all bg-gray-900 ">
              <LivePhoto
                v-if="photo.isLive"
                :image-url="photo.originalUrl"
                :video-url="photo.videoUrl"
                :is-live="photo.isLive"
                :thumb-hash="photo.thumbHash || photo.thumbnailHash"
                :width="photo.width"
                :height="photo.height"
                :photo-id="photo._id"
              />
              <LazyImage
                v-else
                :src="photo.originalUrl"
                :thumb-hash="photo.thumbHash || photo.thumbnailHash"
                :width="photo.width"
                :height="photo.height"
              />

              <!-- 悬浮信息 -->
              <div
                v-if="!photo.isLive"
                class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3"
              >
                <h3 class="text-white font-medium text-xs sm:text-sm line-clamp-1">{{ photo.title }}</h3>
                <p class="text-gray-300 text-xs hidden sm:block">{{ formatDate(photo.dateTaken) }}</p>
                <div v-if="photo.geoinfo?.city" class="flex items-center gap-1 text-gray-400 text-xs mt-1">
                  <MapPin class="w-3 h-3" />
                  {{ photo.geoinfo.city }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </MasonryWall>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center items-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="flex justify-center py-8">
        <el-button
          type="primary"
          size="large"
          :loading="loadingMore"
          @click="loadMorePhotos"
          class="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
          加载更多
        </el-button>
      </div>
    </div>

    <!-- 照片详情对话框 -->
    <el-dialog
      v-model="photoDialogVisible"
      :title="currentPhoto?.title"
      :width="isMobile ? '100%' : '95%'"
      :fullscreen="isMobile"
      :style="{ maxWidth: isMobile ? 'none' : '1200px' }"
      :append-to-body="true"
      :modal-append-to-body="true"
      :z-index="4000"
      :top="isMobile ? '0' : '5vh'"
      class="photo-detail-dialog"
    >
      <div v-if="currentPhoto" class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- 图片 -->
        <div class="lg:col-span-2">
          <img
            :src="currentPhoto.originalUrl"
            :alt="currentPhoto.title"
            class="w-full rounded-xl shadow-lg"
          />
        </div>

        <!-- 信息 -->
        <div class="space-y-4 sm:space-y-6">
          <!-- 基本信息 -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <Info class="w-5 h-5" />
              基本信息
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">尺寸</span>
                <span>{{ currentPhoto.width }} × {{ currentPhoto.height }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">拍摄时间</span>
                <span>{{ formatDate(currentPhoto.dateTaken) }}</span>
              </div>
              <div v-if="currentPhoto.tags?.length" class="flex flex-wrap gap-1 mt-2">
                <el-tag v-for="tag in currentPhoto.tags" :key="tag" size="small">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 相机信息 -->
          <div v-if="currentPhoto.camera" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <Camera class="w-5 h-5" />
              相机信息
            </h3>
            <div class="space-y-2 text-sm">
              <div v-if="currentPhoto.camera.make" class="flex justify-between">
                <span class="text-gray-500">品牌</span>
                <span>{{ currentPhoto.camera.make }}</span>
              </div>
              <div v-if="currentPhoto.camera.model" class="flex justify-between">
                <span class="text-gray-500">型号</span>
                <span>{{ currentPhoto.camera.model }}</span>
              </div>
              <div v-if="currentPhoto.camera.lens" class="flex justify-between">
                <span class="text-gray-500">镜头</span>
                <span>{{ currentPhoto.camera.lens }}</span>
              </div>
            </div>
          </div>

          <!-- EXIF信息 -->
          <div v-if="exifItems.length" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <Settings class="w-5 h-5" />
              拍摄参数
            </h3>
            <div class="space-y-2 text-sm">
              <div v-for="item in exifItems" :key="item.label" class="flex justify-between">
                <span class="text-gray-500">{{ item.label }}</span>
                <span>{{ item.value }}</span>
              </div>
            </div>
          </div>

          <!-- 位置信息 -->
          <div v-if="currentPhoto.location" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <MapPin class="w-5 h-5" />
              位置信息
            </h3>
            <div class="space-y-2 text-sm">
              <div v-if="currentPhoto.geoinfo?.formatted">
                <p class="text-gray-700 dark:text-gray-300">{{ currentPhoto.geoinfo.formatted }}</p>
              </div>
 
            </div>
            
            <!-- 地图 -->
            <div class="mt-3 h-40 sm:h-48">
              <PhotoLocationMap
                :latitude="currentPhoto.location.latitude"
                :longitude="currentPhoto.location.longitude"
                :zoom="14"
              />
            </div>
          </div>

          <!-- 完整 EXIF 信息 -->
          <div v-if="currentPhoto.exif" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <el-collapse v-model="exifCollapseActive" accordion>
              <el-collapse-item name="exif">
                <template #title>
                  <h3 class="font-semibold flex items-center gap-2">
                    <Settings class="w-5 h-5" />
                    完整 EXIF 数据
                    <el-tag size="small" type="info" class="ml-2">
                      {{ Object.keys(currentPhoto.exif).length }} 个字段
                    </el-tag>
                  </h3>
                </template>
                <div class="space-y-1 text-xs max-h-96 overflow-y-auto">
                  <div
                    v-for="[key, value] in sortedExifEntries"
                    :key="key"
                    class="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 rounded"
                  >
                    <span class="text-gray-600 dark:text-gray-400 font-mono">{{ getExifFieldLabel(key) }}</span>
                    <span class="text-gray-900 dark:text-gray-200 text-right ml-4 break-all max-w-xs">
                      {{ formatExifValue(value) }}
                    </span>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue'
import { ImageIcon, MapPin, Info, Camera, Settings } from 'lucide-vue-next'
import MasonryWall from '@yeger/vue-masonry-wall'
import request from '@/api/request'
import { getAssetURL } from '@/utils'
import LazyImage from '@/components/LazyImage.vue'
import LivePhoto from '@/components/LivePhoto.vue'
import PhotoLocationMap from '@/components/PhotoLocationMap.vue'
import type { Photo } from '@/types/api'

interface PhotoWithLoaded extends Photo {
  loaded?: boolean
}

import { useImageLoader } from '@/composables/useImageLoader'

const photos = ref<PhotoWithLoaded[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const photoDialogVisible = ref(false)
const currentPhoto = ref<PhotoWithLoaded | null>(null)
const exifCollapseActive = ref<string[]>([])

// 图片缓存管理
const { getCacheStats, clearCache } = useImageLoader()
const imageCacheStats = computed(() => getCacheStats())

const handleClearImageCache = () => {
  clearCache()
  console.log('🗑️ 已清空图片缓存')
}

const windowWidth = ref(window.innerWidth)

// 检测是否是移动端
const isMobile = computed(() => {
  return windowWidth.value < 768
})

// 响应式列宽
const columnWidth = computed(() => {
  const width = windowWidth.value
  if (width < 640) return 160      // 手机：2列
  if (width < 1024) return 240     // 平板：3-4列
  if (width < 1536) return 300     // 小屏PC：4-5列
  return 360                       // 大屏PC：5-6列
})

const minColumns = computed(() => {
  const width = windowWidth.value
  if (width < 640) return 2
  if (width < 1024) return 3
  if (width < 1536) return 4
  return 5
})

const maxColumns = computed(() => {
  const width = windowWidth.value
  if (width < 640) return 2
  if (width < 1024) return 4
  if (width < 1536) return 5
  return 6
})

const gridGap = computed(() => {
  const width = windowWidth.value
  if (width < 640) return 6
  if (width < 1024) return 8
  return 10
})

const keyMapper = (item: PhotoWithLoaded) => item._id

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 1
})

const hasMore = ref(false)

const loadPhotos = async (reset = true) => {
  if (reset) {
    pagination.page = 1
    photos.value = []
  }

  loading.value = reset
  loadingMore.value = !reset

  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit
    }

    const res: any = await request.get('/photos', { params })

    if (res?.success) {
      const newPhotos = res.data.photos.map((p: Photo) => {
        const photo = {
          ...p,
          loaded: false,
          thumbHash: p.thumbHash || p.thumbnailHash,
          originalUrl: getAssetURL(p.originalUrl),
          videoUrl: p.videoUrl ? getAssetURL(p.videoUrl) : undefined
        }
        return photo
      })
      
      
      if (reset) {
        photos.value = newPhotos
      } else {
        photos.value = [...photos.value, ...newPhotos]
      }

      Object.assign(pagination, res.data.pagination)
      hasMore.value = pagination.page < pagination.pages
    }
  } catch (error: any) {
    // 加载失败
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMorePhotos = () => {
  pagination.page++
  loadPhotos(false)
}

const viewPhoto = async (photo: Photo) => {
  currentPhoto.value = photo
  photoDialogVisible.value = true

  // 拉取完整详情（包含完整 EXIF）
  try {
    const res: any = await request.get(`/photos/${photo._id}`)
    if (res?.success && res.data) {
      currentPhoto.value = { ...photo, ...res.data }
    }
  } catch {
    // 忽略详情加载失败，保留列表数据
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getExifValue = (exif: any, key: string) => {
  if (!exif) return undefined
  return exif[key] ?? exif[key.toLowerCase()] ?? exif[key.toUpperCase()]
}

const exifItems = computed(() => {
  const exif = currentPhoto.value?.exif
  if (!exif) return []

  const items = [
    { label: '曝光时间', value: getExifValue(exif, 'ExposureTime') },
    { label: '曝光补偿', value: getExifValue(exif, 'ExposureCompensation') ?? getExifValue(exif, 'ExposureBiasValue') },
    { label: '光圈', value: getExifValue(exif, 'FNumber') ?? getExifValue(exif, 'ApertureValue') },
    { label: 'ISO', value: getExifValue(exif, 'ISO') },
    { label: '焦距', value: getExifValue(exif, 'FocalLength') },
    { label: '等效焦距', value: getExifValue(exif, 'FocalLengthIn35mmFormat') },
    { label: '测光模式', value: getExifValue(exif, 'MeteringMode') },
    { label: '白平衡', value: getExifValue(exif, 'WhiteBalance') },
    { label: '闪光灯', value: getExifValue(exif, 'Flash') },
    { label: '曝光程序', value: getExifValue(exif, 'ExposureProgram') },
    { label: '镜头', value: getExifValue(exif, 'LensModel') },
  ]

  return items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
})

// 完整 EXIF 数据排序
const sortedExifEntries = computed(() => {
  const exif = currentPhoto.value?.exif
  if (!exif) return []
  
  // 过滤掉不需要显示的字段
  const skipKeys = ['errors', 'warnings', 'SourceFile', 'Directory', 'FileName']
  
  return Object.entries(exif)
    .filter(([key]) => !skipKeys.includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
})

// EXIF 字段中英文映射表
const exifFieldNameMap: Record<string, string> = {
  // 基本信息
  'Make': '相机品牌',
  'Model': '相机型号',
  'Software': '软件版本',
  'Orientation': '方向',
  'ExifVersion': 'EXIF版本',
  'ExifToolVersion': 'ExifTool版本',
  
  // 拍摄参数
  'ExposureTime': '曝光时间',
  'ShutterSpeed': '快门速度',
  'ShutterSpeedValue': '快门速度值',
  'FNumber': '光圈值',
  'Aperture': '光圈',
  'ApertureValue': '光圈数值',
  'ISO': 'ISO感光度',
  'FocalLength': '焦距',
  'FocalLengthIn35mmFormat': '等效35mm焦距',
  'ExposureProgram': '曝光程序',
  'ExposureMode': '曝光模式',
  'ExposureCompensation': '曝光补偿',
  'MeteringMode': '测光模式',
  'Flash': '闪光灯',
  'WhiteBalance': '白平衡',
  'DigitalZoomRatio': '数码变焦',
  'SceneType': '场景类型',
  'BrightnessValue': '亮度值',
  'LightValue': '光线值',
  
  // 镜头信息
  'LensModel': '镜头型号',
  'LensMake': '镜头品牌',
  'LensInfo': '镜头信息',
  
  // 日期时间
  'DateTimeOriginal': '拍摄时间',
  'CreateDate': '创建时间',
  'ModifyDate': '修改时间',
  'DateCreated': '日期创建',
  'SubSecTimeOriginal': '亚秒时间',
  'SubSecCreateDate': '亚秒创建时间',
  'SubSecDateTimeOriginal': '亚秒拍摄时间',
  'SubSecModifyDate': '亚秒修改时间',
  'OffsetTime': '时区偏移',
  'OffsetTimeOriginal': '原始时区',
  'OffsetTimeDigitized': '数字化时区',
  
  // GPS信息
  'GPSLatitude': 'GPS纬度',
  'GPSLongitude': 'GPS经度',
  'GPSAltitude': 'GPS海拔',
  'GPSLatitudeRef': '纬度参考',
  'GPSLongitudeRef': '经度参考',
  'GPSAltitudeRef': '海拔参考',
  'GPSPosition': 'GPS位置',
  'GPSSpeed': 'GPS速度',
  'GPSSpeedRef': '速度参考',
  'GPSImgDirection': '图像方向',
  'GPSImgDirectionRef': '图像方向参考',
  'GPSDestBearing': '目标方位',
  'GPSDestBearingRef': '方位参考',
  'GPSDateStamp': 'GPS日期',
  'GPSTimeStamp': 'GPS时间',
  'GPSDateTime': 'GPS日期时间',
  'GPSHPositioningError': 'GPS水平误差',
  
  // 图像信息
  'ImageWidth': '图像宽度',
  'ImageHeight': '图像高度',
  'ImageSize': '图像尺寸',
  'ExifImageWidth': 'EXIF图像宽度',
  'ExifImageHeight': 'EXIF图像高度',
  'Megapixels': '百万像素',
  'ColorSpace': '色彩空间',
  'ColorSpaceData': '色彩空间数据',
  'XResolution': 'X分辨率',
  'YResolution': 'Y分辨率',
  'ResolutionUnit': '分辨率单位',
  'Rotation': '旋转角度',
  'AspectRatio': '宽高比',
  
  // 文件信息
  'FileType': '文件类型',
  'FileTypeExtension': '文件扩展名',
  'MIMEType': 'MIME类型',
  'FileSize': '文件大小',
  'FileModifyDate': '文件修改日期',
  'FileAccessDate': '文件访问日期',
  'FileInodeChangeDate': '文件节点变更日期',
  'FilePermissions': '文件权限',
  
  // 相机特定
  'SensingMethod': '感光方式',
  'CompositeImage': '合成图像',
  'HostComputer': '主机',
  'TileWidth': '瓦片宽度',
  'TileLength': '瓦片长度',
  'SubjectArea': '主体区域',
  'FocusDistanceRange': '对焦距离范围',
  'FocusPosition': '对焦位置',
  'AFStable': 'AF稳定',
  'AFMeasuredDepth': 'AF测量深度',
  'AFConfidence': 'AF置信度',
  'FrontFacingCamera': '前置摄像头',
  
  // iPhone 特定
  'RunTimeFlags': '运行时标志',
  'RunTimeValue': '运行时值',
  'RunTimeScale': '运行时刻度',
  'RunTimeEpoch': '运行时纪元',
  'RunTimeSincePowerUp': '开机运行时间',
  'AEStable': 'AE稳定',
  'AETarget': 'AE目标',
  'AEAverage': 'AE平均',
  'AccelerationVector': '加速度矢量',
  'ContentIdentifier': '内容标识符',
  'ImageCaptureType': '图像捕获类型',
  'LivePhotoVideoIndex': 'Live Photo视频索引',
  'HDRHeadroom': 'HDR余量',
  'HDRGain': 'HDR增益',
  'HDRGainMapVersion': 'HDR增益映射版本',
  'SignalToNoiseRatio': '信噪比',
  'PhotoIdentifier': '照片标识符',
  'SemanticStyle': '语义风格',
  
  // 色彩管理
  'ProfileCMMType': '配置文件CMM类型',
  'ProfileVersion': '配置文件版本',
  'ProfileClass': '配置文件类别',
  'ProfileConnectionSpace': '配置文件连接空间',
  'ProfileDateTime': '配置文件日期',
  'ProfileFileSignature': '配置文件签名',
  'PrimaryPlatform': '主平台',
  'ProfileDescription': '配置文件描述',
  'ProfileCopyright': '配置文件版权',
  'ProfileCreator': '配置文件创建者',
  'ProfileID': '配置文件ID',
  'DeviceManufacturer': '设备制造商',
  'DeviceModel': '设备型号',
  'DeviceAttributes': '设备属性',
  'RenderingIntent': '渲染意图',
  'MediaWhitePoint': '媒体白点',
  'RedMatrixColumn': '红色矩阵列',
  'GreenMatrixColumn': '绿色矩阵列',
  'BlueMatrixColumn': '蓝色矩阵列',
  'RedTRC': '红色TRC',
  'GreenTRC': '绿色TRC',
  'BlueTRC': '蓝色TRC',
  'ChromaticAdaptation': '色适应',
  'ConnectionSpaceIlluminant': '连接空间照明',
  'CMMFlags': 'CMM标志',
  
  // HEIC/编码信息
  'MajorBrand': '主品牌',
  'MinorVersion': '次版本',
  'CompatibleBrands': '兼容品牌',
  'HandlerType': '处理器类型',
  'PrimaryItemReference': '主项引用',
  'MetaImageSize': '元图像尺寸',
  'ExifByteOrder': 'EXIF字节序',
  'MediaDataSize': '媒体数据大小',
  'MediaDataOffset': '媒体数据偏移',
  
  // 视频编码
  'HEVCConfigurationVersion': 'HEVC配置版本',
  'GeneralProfileSpace': '通用配置空间',
  'GeneralTierFlag': '通用层标志',
  'GeneralProfileIDC': '通用配置IDC',
  'GenProfileCompatibilityFlags': '通用配置兼容标志',
  'ConstraintIndicatorFlags': '约束指示标志',
  'GeneralLevelIDC': '通用级别IDC',
  'MinSpatialSegmentationIDC': '最小空间分割IDC',
  'ParallelismType': '并行类型',
  'ChromaFormat': '色度格式',
  'BitDepthLuma': '亮度位深',
  'BitDepthChroma': '色度位深',
  'AverageFrameRate': '平均帧率',
  'ConstantFrameRate': '恒定帧率',
  'NumTemporalLayers': '时间层数',
  'TemporalIDNested': '时间ID嵌套',
  'ImageSpatialExtent': '图像空间范围',
  'ImagePixelDepth': '图像像素深度',
  'AuxiliaryImageType': '辅助图像类型',
  
  // XMP
  'XMPToolkit': 'XMP工具包',
  'CreatorTool': '创建工具',
  
  // 其他
  'ScaleFactor35efl': '35mm等效比例因子',
  'CircleOfConfusion': '弥散圆',
  'FOV': '视场角',
  'HyperfocalDistance': '超焦距',
  'LensID': '镜头ID',
  'tz': '时区',
  'tzSource': '时区来源',
}

// 获取字段的中文名称
const getExifFieldLabel = (key: string): string => {
  return exifFieldNameMap[key] || key
}

// 格式化 EXIF 值
const formatExifValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  
  // 处理对象类型（如日期对象）
  if (typeof value === 'object') {
    // 处理日期对象
    if (value.year && value.month && value.day) {
      const parts = [
        `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
      ]
      if (value.hour !== undefined) {
        parts.push(`${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}:${String(value.second).padStart(2, '0')}`)
      }
      if (value.zone) {
        parts.push(value.zone)
      }
      return parts.join(' ')
    }
    
    // 处理数组
    if (Array.isArray(value)) {
      if (value.length > 5) {
        return `[${value.slice(0, 5).join(', ')}...] (${value.length} items)`
      }
      return `[${value.join(', ')}]`
    }
    
    // 处理其他对象
    try {
      const str = JSON.stringify(value)
      if (str.length > 100) {
        return str.substring(0, 100) + '...'
      }
      return str
    } catch {
      return String(value)
    }
  }
  
  // 处理数字
  if (typeof value === 'number') {
    // 如果是小数且很长，保留6位
    if (value % 1 !== 0 && Math.abs(value) < 1000) {
      return value.toFixed(6).replace(/\.?0+$/, '')
    }
    return String(value)
  }
  
  // 处理字符串
  const strValue = String(value)
  if (strValue.length > 150) {
    return strValue.substring(0, 150) + '...'
  }
  
  return strValue
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  loadPhotos()
  window.addEventListener('resize', handleResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.photo-detail-dialog :deep(.el-dialog) {
  margin: 0 auto;
  max-height: 90vh;
}

.photo-detail-dialog :deep(.el-dialog__body) {
  max-height: calc(90vh - 56px);
  overflow-y: auto;
}

.photo-detail-dialog :deep(.el-dialog__header) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--el-bg-color, #fff);
}

.photo-detail-dialog :deep(.el-dialog__headerbtn) {
  position: sticky;
  top: 0;
  z-index: 2;
}

@media (max-width: 768px) {
  .photo-detail-dialog :deep(.el-dialog) {
    margin: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh;
    border-radius: 0;
  }

  .photo-detail-dialog :deep(.el-dialog__body) {
    max-height: calc(100vh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    padding-top: calc(1rem + env(safe-area-inset-top));
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }

  .photo-detail-dialog :deep(.el-dialog__header) {
    padding-top: calc(1rem + env(safe-area-inset-top));
  }
}
.photo-detail-dialog :deep(.el-dialog__body) {
  padding: 1.5rem;
}
</style>
