<script setup lang="ts">
import { computed, ref } from 'vue'
import { motion } from 'motion-v'

interface Props {
  currentPhoto: any
  onClose?: () => void
}

const exifCollapseActive = ref<string[]>([])

const props = defineProps<Props>()

// 完整 EXIF 数据排序
const sortedExifEntries = computed(() => {
  const exif = props.currentPhoto?.exif
  if (!exif) return []

  // 过滤掉不需要显示的字段
  const skipKeys = [
    'errors',
    'warnings',
    'SourceFile',
    'Directory',
    'FileName',
  ]

  return Object.entries(exif)
    .filter(([key]) => !skipKeys.includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
})

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
})

// EXIF 字段中英文映射表
const exifFieldNameMap: Record<string, string> = {
  // 基本信息
  Make: '相机品牌',
  Model: '相机型号',
  Software: '软件版本',
  Orientation: '方向',
  ExifVersion: 'EXIF版本',
  ExifToolVersion: 'ExifTool版本',

  // 拍摄参数
  ExposureTime: '曝光时间',
  ShutterSpeed: '快门速度',
  ShutterSpeedValue: '快门速度值',
  FNumber: '光圈值',
  Aperture: '光圈',
  ApertureValue: '光圈数值',
  ISO: 'ISO感光度',
  FocalLength: '焦距',
  FocalLengthIn35mmFormat: '等效35mm焦距',
  ExposureProgram: '曝光程序',
  ExposureMode: '曝光模式',
  ExposureCompensation: '曝光补偿',
  MeteringMode: '测光模式',
  Flash: '闪光灯',
  WhiteBalance: '白平衡',
  DigitalZoomRatio: '数码变焦',
  SceneType: '场景类型',
  BrightnessValue: '亮度值',
  LightValue: '光线值',

  // 镜头信息
  LensModel: '镜头型号',
  LensMake: '镜头品牌',
  LensInfo: '镜头信息',

  // 日期时间
  DateTimeOriginal: '拍摄时间',
  CreateDate: '创建时间',
  ModifyDate: '修改时间',
  DateCreated: '日期创建',
  SubSecTimeOriginal: '亚秒时间',
  SubSecCreateDate: '亚秒创建时间',
  SubSecDateTimeOriginal: '亚秒拍摄时间',
  SubSecModifyDate: '亚秒修改时间',
  OffsetTime: '时区偏移',
  OffsetTimeOriginal: '原始时区',
  OffsetTimeDigitized: '数字化时区',

  // GPS信息
  GPSLatitude: 'GPS纬度',
  GPSLongitude: 'GPS经度',
  GPSAltitude: 'GPS海拔',
  GPSLatitudeRef: '纬度参考',
  GPSLongitudeRef: '经度参考',
  GPSAltitudeRef: '海拔参考',
  GPSPosition: 'GPS位置',
  GPSSpeed: 'GPS速度',
  GPSSpeedRef: '速度参考',
  GPSImgDirection: '图像方向',
  GPSImgDirectionRef: '图像方向参考',
  GPSDestBearing: '目标方位',
  GPSDestBearingRef: '方位参考',
  GPSDateStamp: 'GPS日期',
  GPSTimeStamp: 'GPS时间',
  GPSDateTime: 'GPS日期时间',
  GPSHPositioningError: 'GPS水平误差',

  // 图像信息
  ImageWidth: '图像宽度',
  ImageHeight: '图像高度',
  ImageSize: '图像尺寸',
  ExifImageWidth: 'EXIF图像宽度',
  ExifImageHeight: 'EXIF图像高度',
  Megapixels: '百万像素',
  ColorSpace: '色彩空间',
  ColorSpaceData: '色彩空间数据',
  XResolution: 'X分辨率',
  YResolution: 'Y分辨率',
  ResolutionUnit: '分辨率单位',
  Rotation: '旋转角度',
  AspectRatio: '宽高比',

  // 文件信息
  FileType: '文件类型',
  FileTypeExtension: '文件扩展名',
  MIMEType: 'MIME类型',
  FileSize: '文件大小',
  FileModifyDate: '文件修改日期',
  FileAccessDate: '文件访问日期',
  FileInodeChangeDate: '文件节点变更日期',
  FilePermissions: '文件权限',

  // 相机特定
  SensingMethod: '感光方式',
  CompositeImage: '合成图像',
  HostComputer: '主机',
  TileWidth: '瓦片宽度',
  TileLength: '瓦片长度',
  SubjectArea: '主体区域',
  FocusDistanceRange: '对焦距离范围',
  FocusPosition: '对焦位置',
  AFStable: 'AF稳定',
  AFMeasuredDepth: 'AF测量深度',
  AFConfidence: 'AF置信度',
  FrontFacingCamera: '前置摄像头',

  // iPhone 特定
  RunTimeFlags: '运行时标志',
  RunTimeValue: '运行时值',
  RunTimeScale: '运行时刻度',
  RunTimeEpoch: '运行时纪元',
  RunTimeSincePowerUp: '开机运行时间',
  AEStable: 'AE稳定',
  AETarget: 'AE目标',
  AEAverage: 'AE平均',
  AccelerationVector: '加速度矢量',
  ContentIdentifier: '内容标识符',
  ImageCaptureType: '图像捕获类型',
  LivePhotoVideoIndex: 'Live Photo视频索引',
  HDRHeadroom: 'HDR余量',
  HDRGain: 'HDR增益',
  HDRGainMapVersion: 'HDR增益映射版本',
  SignalToNoiseRatio: '信噪比',
  PhotoIdentifier: '照片标识符',
  SemanticStyle: '语义风格',

  // 色彩管理
  ProfileCMMType: '配置文件CMM类型',
  ProfileVersion: '配置文件版本',
  ProfileClass: '配置文件类别',
  ProfileConnectionSpace: '配置文件连接空间',
  ProfileDateTime: '配置文件日期',
  ProfileFileSignature: '配置文件签名',
  PrimaryPlatform: '主平台',
  ProfileDescription: '配置文件描述',
  ProfileCopyright: '配置文件版权',
  ProfileCreator: '配置文件创建者',
  ProfileID: '配置文件ID',
  DeviceManufacturer: '设备制造商',
  DeviceModel: '设备型号',
  DeviceAttributes: '设备属性',
  RenderingIntent: '渲染意图',
  MediaWhitePoint: '媒体白点',
  RedMatrixColumn: '红色矩阵列',
  GreenMatrixColumn: '绿色矩阵列',
  BlueMatrixColumn: '蓝色矩阵列',
  RedTRC: '红色TRC',
  GreenTRC: '绿色TRC',
  BlueTRC: '蓝色TRC',
  ChromaticAdaptation: '色适应',
  ConnectionSpaceIlluminant: '连接空间照明',
  CMMFlags: 'CMM标志',

  // HEIC/编码信息
  MajorBrand: '主品牌',
  MinorVersion: '次版本',
  CompatibleBrands: '兼容品牌',
  HandlerType: '处理器类型',
  PrimaryItemReference: '主项引用',
  MetaImageSize: '元图像尺寸',
  ExifByteOrder: 'EXIF字节序',
  MediaDataSize: '媒体数据大小',
  MediaDataOffset: '媒体数据偏移',

  // 视频编码
  HEVCConfigurationVersion: 'HEVC配置版本',
  GeneralProfileSpace: '通用配置空间',
  GeneralTierFlag: '通用层标志',
  GeneralProfileIDC: '通用配置IDC',
  GenProfileCompatibilityFlags: '通用配置兼容标志',
  ConstraintIndicatorFlags: '约束指示标志',
  GeneralLevelIDC: '通用级别IDC',
  MinSpatialSegmentationIDC: '最小空间分割IDC',
  ParallelismType: '并行类型',
  ChromaFormat: '色度格式',
  BitDepthLuma: '亮度位深',
  BitDepthChroma: '色度位深',
  AverageFrameRate: '平均帧率',
  ConstantFrameRate: '恒定帧率',
  NumTemporalLayers: '时间层数',
  TemporalIDNested: '时间ID嵌套',
  ImageSpatialExtent: '图像空间范围',
  ImagePixelDepth: '图像像素深度',
  AuxiliaryImageType: '辅助图像类型',

  // XMP
  XMPToolkit: 'XMP工具包',
  CreatorTool: '创建工具',

  // 其他
  ScaleFactor35efl: '35mm等效比例因子',
  CircleOfConfusion: '弥散圆',
  FOV: '视场角',
  HyperfocalDistance: '超焦距',
  LensID: '镜头ID',
  tz: '时区',
  tzSource: '时区来源',
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
        `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`,
      ]
      if (value.hour !== undefined) {
        parts.push(
          `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}:${String(value.second).padStart(2, '0')}`,
        )
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
</script>

<template>
  <motion.div
    :initial="{
      opacity: 0,
      x: isMobile ? 0 : 80,
      y: isMobile ? 20 : 0,
    }"
    :animate="{
      opacity: 1,
      x: 0,
      y: 0,
    }"
    :exit="{
      opacity: 0,
      x: isMobile ? 0 : 80,
      y: isMobile ? 20 : 0,
    }"
    :transition="{ type: 'spring', duration: 0.4, bounce: 0, delay: 0.1 }"
    class="bg-black/20 dark:bg-black/30 backdrop-blur-xl border-white/10"
    :class="{
      'fixed inset-x-2 bottom-2 max-h-[70vh] border rounded-xl z-50 flex flex-col':
        isMobile,
      'w-80 border-l': !isMobile,
    }"
  >
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0"
    >
      <h3 class="font-black text-white text-ellipsis line-clamp-1">
        {{ currentPhoto.title || '照片信息' }}
      </h3>
      <button
        v-if="isMobile && onClose"
        @click="onClose"
        class="text-white hover:text-white/80"
      >
        ✕
      </button>
    </div>

    <!-- 内容区域 -->
    <div
      class="p-4 space-y-4 flex-1 min-h-0"
      :class="{
        'overflow-y-auto': isMobile,
        'overflow-y-auto max-h-full pb-16': !isMobile,
      }"
    >


    1
      <!-- 完整 EXIF 信息 -->
      <div
        v-if="currentPhoto.exif"
        class="bg-white/5 border border-white/10 rounded-lg p-3"
      >
        <details>
          <summary class="cursor-pointer text-sm font-medium text-white uppercase tracking-wide hover:text-white/80">
            完整 EXIF 数据 ({{ sortedExifEntries.length }} 个字段)
          </summary>
          <div class="space-y-1 text-xs max-h-96 overflow-y-auto mt-2">
            <div
              v-for="[key, value] in sortedExifEntries"
              :key="key"
              class="flex justify-between py-1 border-b border-white/10 last:border-0 hover:bg-white/10 px-2 rounded transition-colors"
            >
              <span class="text-white/60 font-mono">{{
                getExifFieldLabel(key)
              }}</span>
              <span
                class="text-white text-right ml-4 break-all max-w-[60%]"
              >
                {{ formatExifValue(value) }}
              </span>
            </div>
          </div>
        </details>
      </div>
    </div>
  </motion.div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
