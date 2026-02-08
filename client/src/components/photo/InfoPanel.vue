<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { motion } from "motion-v";
import { MapPin, Settings, X } from "lucide-vue-next";
import service from "@/api/request";
import { formatFileSize } from "@/utils/format";

interface Props {
  currentPhoto: any;
  onClose?: () => void;
}

const exifCollapseActive = ref<string[]>([]);
const isLoadingExif = ref(false);
const photoData = ref<any>(null);

const props = defineProps<Props>();

// 加载EXIF数据的函数
const loadExifData = async () => {
  if (!props.currentPhoto?._id) {
    photoData.value = props.currentPhoto;
    return;
  }

  // 直接拉取完整详情（包含完整 EXIF）
  try {
    isLoadingExif.value = true;
    const res: any = await service.get(`/photos/${props.currentPhoto._id}`);

    if (res?.success && res.data) {
      photoData.value = { ...props.currentPhoto, ...res.data };
    } else {
      photoData.value = props.currentPhoto;
    }
  } catch (error) {
    console.error("Failed to load photo details:", error);
    // 加载失败，使用传入的数据
    photoData.value = props.currentPhoto;
  } finally {
    isLoadingExif.value = false;
  }
};

// 初始化时加载完整的 EXIF 数据
onMounted(() => {
  loadExifData();
});

// 监听图片变化，重新加载EXIF数据
watch(
  () => props.currentPhoto?._id,
  () => {
    photoData.value = null; // 重置photoData
    loadExifData();
  },
  { immediate: false },
);

// 使用 photoData 或 currentPhoto
const displayPhoto = computed(() => photoData.value || props.currentPhoto);
console.log(displayPhoto.value);

const isMobile = computed(
  () => typeof window !== "undefined" && window.innerWidth < 768,
);

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getExifValue = (exif: any, key: string) => {
  if (!exif) return undefined;
  // 精确匹配 + 小写 + 大写
  const result =
    exif[key] ?? exif[key.toLowerCase()] ?? exif[key.toUpperCase()];
  // 过滤掉空对象和仅有 bytes/rawValue 的对象
  if (typeof result === "object" && result !== null && !Array.isArray(result)) {
    if (Object.keys(result).length === 0 || (result.bytes && !result.value)) {
      return undefined;
    }
  }
  return result;
};

const exifItems = computed(() => {
  const exif = displayPhoto.value?.exif;

  if (!exif) return [];

  const skipKeys = [
    "errors",
    "warnings",
    "SourceFile",
    "Directory",
    "FileName",
  ];

  const items = Object.entries(exif)
    .filter(([key, value]) => {
      if (skipKeys.includes(key)) return false;
      if (value === undefined || value === null || value === "") return false;

      // 过滤掉只有 bytes/rawValue 的二进制数据对象
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        if (
          (value as any).bytes &&
          (value as any).rawValue &&
          Object.keys(value).length <= 2
        ) {
          return false;
        }
      }

      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      label: exifFieldNameMap[key] || key,
      value,
      field: key,
    }));

  return items;
});

// 完整 EXIF 数据排序
const sortedExifEntries = computed(() => {
  const exif = displayPhoto.value?.exif;
  if (!exif) return [];

  // 过滤掉不需要显示的字段
  const skipKeys = [
    "errors",
    "warnings",
    "SourceFile",
    "Directory",
    "FileName",
  ];

  return Object.entries(exif)
    .filter(([key]) => !skipKeys.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));
});

// EXIF 字段中英文映射表
const exifFieldNameMap: Record<string, string> = {
  // 基本信息
  Make: "相机品牌",
  Model: "相机型号",
  Software: "软件版本",
  Orientation: "方向",
  ExifVersion: "EXIF版本",
  ExifToolVersion: "ExifTool版本",

  // 拍摄参数
  ExposureTime: "曝光时间",
  ShutterSpeed: "快门速度",
  ShutterSpeedValue: "快门速度值",
  FNumber: "光圈值",
  Aperture: "光圈",
  ApertureValue: "光圈数值",
  ISO: "ISO感光度",
  FocalLength: "焦距",
  FocalLengthIn35mmFormat: "等效35mm焦距",
  ExposureProgram: "曝光程序",
  ExposureMode: "曝光模式",
  ExposureCompensation: "曝光补偿",
  ExposureBiasValue: "曝光偏移",
  MeteringMode: "测光模式",
  Flash: "闪光灯",
  WhiteBalance: "白平衡",
  LightSource: "光源",
  DigitalZoomRatio: "数码变焦",
  SceneType: "场景类型",
  BrightnessValue: "亮度值",
  LightValue: "光线值",
  FocalLength35efl: "35mm等效焦距",

  // 镜头信息
  LensModel: "镜头型号",
  LensMake: "镜头品牌",
  LensInfo: "镜头信息",

  // 日期时间
  DateTimeOriginal: "拍摄时间",
  CreateDate: "创建时间",
  ModifyDate: "修改时间",
  DateCreated: "日期创建",
  SubSecTimeOriginal: "亚秒时间",
  SubSecTimeDigitized: "亚秒数字化时间",
  SubSecTime: "亚秒时间",
  SubSecCreateDate: "亚秒创建时间",
  SubSecDateTimeOriginal: "亚秒拍摄时间",
  SubSecModifyDate: "亚秒修改时间",
  OffsetTime: "时区偏移",
  OffsetTimeOriginal: "原始时区",
  OffsetTimeDigitized: "数字化时区",

  // GPS信息
  GPSLatitude: "GPS纬度",
  GPSLongitude: "GPS经度",
  GPSAltitude: "GPS海拔",
  GPSLatitudeRef: "纬度参考",
  GPSLongitudeRef: "经度参考",
  GPSAltitudeRef: "海拔参考",
  GPSPosition: "GPS位置",
  GPSSpeed: "GPS速度",
  GPSSpeedRef: "速度参考",
  GPSImgDirection: "图像方向",
  GPSImgDirectionRef: "图像方向参考",
  GPSDestBearing: "目标方位",
  GPSDestBearingRef: "方位参考",
  GPSDateStamp: "GPS日期",
  GPSTimeStamp: "GPS时间",
  GPSDateTime: "GPS日期时间",
  GPSHPositioningError: "GPS水平误差",

  // 图像信息
  ImageWidth: "图像宽度",
  ImageHeight: "图像高度",
  ImageSize: "图像尺寸",
  ExifImageWidth: "EXIF图像宽度",
  ExifImageHeight: "EXIF图像高度",
  Megapixels: "百万像素",
  ColorSpace: "色彩空间",
  ColorSpaceData: "色彩空间数据",
  XResolution: "X分辨率",
  YResolution: "Y分辨率",
  ResolutionUnit: "分辨率单位",
  Rotation: "旋转角度",
  AspectRatio: "宽高比",
  YCbCrPositioning: "YCbCr位置",
  ComponentsConfiguration: "组件配置",

  // 文件信息
  FileType: "文件类型",
  FileTypeExtension: "文件扩展名",
  MIMEType: "MIME类型",
  FileSize: "文件大小",
  FileModifyDate: "文件修改日期",
  FileAccessDate: "文件访问日期",
  FileInodeChangeDate: "文件节点变更日期",
  FilePermissions: "文件权限",
  Compression: "压缩方式",
  ThumbnailOffset: "缩略图偏移",
  ThumbnailLength: "缩略图长度",

  // 相机特定
  SensingMethod: "感光方式",
  CompositeImage: "合成图像",
  HostComputer: "主机",
  TileWidth: "瓦片宽度",
  TileLength: "瓦片长度",
  SubjectArea: "主体区域",
  FocusDistanceRange: "对焦距离范围",
  FocusPosition: "对焦位置",
  AFStable: "AF稳定",
  AFMeasuredDepth: "AF测量深度",
  AFConfidence: "AF置信度",
  FrontFacingCamera: "前置摄像头",
  MakerNoteVersion: "厂商注释版本",

  // iPhone 特定
  RunTimeFlags: "运行时标志",
  RunTimeValue: "运行时值",
  RunTimeScale: "运行时刻度",
  RunTimeEpoch: "运行时纪元",
  RunTimeSincePowerUp: "开机运行时间",
  AEStable: "AE稳定",
  AETarget: "AE目标",
  AEAverage: "AE平均",
  AccelerationVector: "加速度矢量",
  ContentIdentifier: "内容标识符",
  ImageCaptureType: "图像捕获类型",
  LivePhotoVideoIndex: "Live Photo视频索引",
  HDRHeadroom: "HDR余量",
  HDRGain: "HDR增益",
  HDRGainMapVersion: "HDR增益映射版本",
  SignalToNoiseRatio: "信噪比",
  PhotoIdentifier: "照片标识符",
  SemanticStyle: "语义风格",

  // 色彩管理
  ProfileCMMType: "配置文件CMM类型",
  ProfileVersion: "配置文件版本",
  ProfileClass: "配置文件类别",
  ProfileConnectionSpace: "配置文件连接空间",
  ProfileDateTime: "配置文件日期",
  ProfileFileSignature: "配置文件签名",
  PrimaryPlatform: "主平台",
  ProfileDescription: "配置文件描述",
  ProfileCopyright: "配置文件版权",
  ProfileCreator: "配置文件创建者",
  ProfileID: "配置文件ID",
  DeviceManufacturer: "设备制造商",
  DeviceModel: "设备型号",
  DeviceAttributes: "设备属性",
  RenderingIntent: "渲染意图",
  MediaWhitePoint: "媒体白点",
  RedMatrixColumn: "红色矩阵列",
  GreenMatrixColumn: "绿色矩阵列",
  BlueMatrixColumn: "蓝色矩阵列",
  RedTRC: "红色TRC",
  GreenTRC: "绿色TRC",
  BlueTRC: "蓝色TRC",
  ChromaticAdaptation: "色适应",
  ConnectionSpaceIlluminant: "连接空间照明",
  CMMFlags: "CMM标志",

  // HEIC/编码信息
  MajorBrand: "主品牌",
  MinorVersion: "次版本",
  CompatibleBrands: "兼容品牌",
  HandlerType: "处理器类型",
  PrimaryItemReference: "主项引用",
  MetaImageSize: "元图像尺寸",
  ExifByteOrder: "EXIF字节序",
  MediaDataSize: "媒体数据大小",
  MediaDataOffset: "媒体数据偏移",
  MPFVersion: "MPF版本",
  NumberOfImages: "图像数量",
  MPImageFlags: "MP图像标志",
  MPImageFormat: "MP图像格式",
  MPImageType: "MP图像类型",
  MPImageLength: "MP图像长度",
  MPImageStart: "MP图像起始",
  DependentImage1EntryNumber: "依赖图像1条目号",
  DependentImage2EntryNumber: "依赖图像2条目号",

  // 视频编码
  HEVCConfigurationVersion: "HEVC配置版本",
  GeneralProfileSpace: "通用配置空间",
  GeneralTierFlag: "通用层标志",
  GeneralProfileIDC: "通用配置IDC",
  GenProfileCompatibilityFlags: "通用配置兼容标志",
  ConstraintIndicatorFlags: "约束指示标志",
  GeneralLevelIDC: "通用级别IDC",
  MinSpatialSegmentationIDC: "最小空间分割IDC",
  ParallelismType: "并行类型",
  ChromaFormat: "色度格式",
  BitDepthLuma: "亮度位深",
  BitDepthChroma: "色度位深",
  AverageFrameRate: "平均帧率",
  ConstantFrameRate: "恒定帧率",
  NumTemporalLayers: "时间层数",
  TemporalIDNested: "时间ID嵌套",
  ImageSpatialExtent: "图像空间范围",
  ImagePixelDepth: "图像像素深度",
  AuxiliaryImageType: "辅助图像类型",

  // XMP
  XMPToolkit: "XMP工具包",
  CreatorTool: "创建工具",

  // 其他
  ScaleFactor35efl: "35mm等效比例因子",
  CircleOfConfusion: "弥散圆",
  FOV: "视场角",
  HyperfocalDistance: "超焦距",
  LensID: "镜头ID",
  tz: "时区",
  tzSource: "时区来源",
};

// 获取字段的中文名称
const getExifFieldLabel = (key: string): string => {
  return exifFieldNameMap[key] || key;
};

// 格式化 EXIF 值
const formatExifValue = (value: any): string => {
  if (value === null || value === undefined) return "-";

  // 处理对象类型（如日期对象）
  if (typeof value === "object") {
    // 处理日期对象
    if (value.year && value.month && value.day) {
      const parts = [
        `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`,
      ];
      if (value.hour !== undefined) {
        parts.push(
          `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}:${String(value.second).padStart(2, "0")}`,
        );
      }
      if (value.zone) {
        parts.push(value.zone);
      }
      return parts.join(" ");
    }

    // 处理数组
    if (Array.isArray(value)) {
      if (value.length > 5) {
        return `[${value.slice(0, 5).join(", ")}...] (${value.length} items)`;
      }
      return `[${value.join(", ")}]`;
    }

    // 处理其他对象
    try {
      const str = JSON.stringify(value);
      if (str.length > 100) {
        return str.substring(0, 100) + "...";
      }
      return str;
    } catch {
      return String(value);
    }
  }

  // 处理数字
  if (typeof value === "number") {
    // 如果是小数且很长，保留6位
    if (value % 1 !== 0 && Math.abs(value) < 1000) {
      return value.toFixed(6).replace(/\.?0+$/, "");
    }
    return String(value);
  }

  // 处理字符串
  const strValue = String(value);
  if (strValue.length > 150) {
    return strValue.substring(0, 150) + "...";
  }

  return strValue;
};
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
    :transition="{ type: 'spring', stiffness: 100, damping: 25, delay: 0.1 }"
    class="bg-slate-950/70 backdrop-blur-2xl border border-slate-700/50"
    :class="{
      'fixed inset-x-2 bottom-2 max-h-[70vh] rounded-2xl z-50 flex flex-col shadow-2xl':
        isMobile,
      'w-96 border-l rounded-r-2xl h-full flex flex-col': !isMobile,
    }"
  >
    <!-- 头部 -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b border-slate-700/30 flex-shrink-0 bg-slate-900/50"
    >
      <h3
        class="font-bold text-white text-ellipsis line-clamp-1 text-sm tracking-wide"
      >
        {{ displayPhoto.title || "照片详情" }}
      </h3>
      <button
        v-if="onClose"
        @click="onClose"
        class="text-slate-400 hover:text-white transition-colors duration-200 p-1 hover:bg-slate-700/50 rounded-lg"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div class="p-5 space-y-5">
        <!-- 照片描述 -->
        <div
          v-if="displayPhoto.description"
          class="text-xs text-slate-200 text-justify leading-relaxed bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/40"
        >
          {{ displayPhoto.description }}
        </div>
        <!-- 位置信息 Section -->
        <div v-if="displayPhoto.location" class="space-y-3">
          <!-- 地图 -->
          <div
            class="h-40 rounded-lg overflow-hidden bg-slate-900/50 border border-slate-700/40 shadow-inner"
          >
            <PhotoLocationMap
              :latitude="displayPhoto.location.latitude"
              :longitude="displayPhoto.location.longitude"
              :zoom="14"
            />
          </div>
        </div>

        <!-- 基本信息 Section -->
        <div v-if="displayPhoto.width && displayPhoto.height" class="space-y-3">
          <h4
            class="text-xs font-bold text-white uppercase tracking-widest px-1 whitespace-nowrap"
          >
            基本信息
          </h4>
          <div
            class="rounded-xl bg-slate-800/30 border border-slate-700/40 overflow-hidden"
          >
            <div
              class="flex items-center justify-between text-xs px-4 py-3 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <span class="text-slate-300 whitespace-nowrap">文件名</span>
              <span class="text-white font-mono font-semibold">{{
                displayPhoto.baseName
              }}</span>
            </div>
            <div
              class="flex items-center justify-between text-xs px-4 py-3 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <span class="text-slate-300 whitespace-nowrap">文件大小</span>
              <span class="text-white font-mono font-semibold">{{
                formatFileSize(Number(displayPhoto.fileSize))
              }}</span>
            </div>
            <div
              class="flex items-center justify-between text-xs px-4 py-3 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <span class="text-slate-300 whitespace-nowrap">分辨率</span>
              <span class="text-white font-mono font-semibold"
                >{{ displayPhoto.width }} × {{ displayPhoto.height }}</span
              >
            </div>
            <div
              class="flex items-center justify-between text-xs px-4 py-3 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <span class="text-slate-300 whitespace-nowrap">拍摄时间</span>
              <span class="text-white font-mono text-right text-xs">{{
                formatDate(displayPhoto.dateTaken)
              }}</span>
            </div>
            <div
              v-if="displayPhoto.exif?.Megapixels"
              class="flex items-center justify-between text-xs px-4 py-3 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <span class="text-slate-300 whitespace-nowrap">像素</span>
              <span class="text-white font-mono font-semibold"
                >{{ displayPhoto.exif?.Megapixels }}
              </span>
            </div>
            <div
              v-if="displayPhoto.tags?.length"
              class="px-4 py-3 flex flex-wrap gap-1.5"
            >
              <span
                v-for="tag in displayPhoto.tags"
                :key="tag"
                class="inline-flex bg-slate-700/50 text-slate-100 px-2.5 py-1.5 rounded-full text-xs font-medium hover:bg-slate-600/70 transition-colors duration-150 border border-slate-600/50"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        <!-- 相机信息 Section -->
        <div
          v-if="displayPhoto.exif?.Make || displayPhoto.exif?.Model"
          class="space-y-3"
        >
          <h4
            class="text-xs font-bold text-white uppercase tracking-widest px-1 whitespace-nowrap"
          >
            设备信息
          </h4>
          <div
            class="rounded-xl bg-slate-800/30 border border-slate-700/40 overflow-hidden min-h-[80px]"
          >
            <div
              v-if="displayPhoto.exif?.Make"
              class="flex items-center justify-between text-xs px-4 py-2.5 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <span class="text-slate-300 whitespace-nowrap">品牌</span>
              <span class="text-white font-semibold">{{
                displayPhoto.exif.Make
              }}</span>
            </div>
            <div
              v-if="displayPhoto.exif?.Model"
              class="flex items-center justify-between text-xs px-4 py-2.5 hover:bg-slate-700/30 transition-all duration-150"
            >
              <span class="text-slate-300 whitespace-nowrap">型号</span>
              <span class="text-white font-semibold">{{
                displayPhoto.exif.Model
              }}</span>
            </div>
            <div
              v-if="displayPhoto.exif?.LensModel || displayPhoto.camera?.lens"
              class="flex items-start justify-between gap-1 text-xs px-4 py-2.5 hover:bg-slate-700/30 transition-all duration-150 border-b border-slate-700/20 last:border-0"
            >
              <div class="text-slate-300 whitespace-nowrap ">镜头</div>
              <div class="text-white font-semibold ">{{
                displayPhoto.exif?.LensModel || displayPhoto.camera?.lens
              }}</div>
            </div>
            <div
              v-if="displayPhoto.exif?.LensInfo"
              class="flex items-center justify-between text-xs px-4 py-2.5 hover:bg-slate-700/30 transition-all duration-150"
            >
              <span class="text-slate-300 whitespace-nowrap">信息</span>
              <span
                class="text-white text-right max-w-xs truncate font-semibold"
                >{{ displayPhoto.exif.LensInfo }}</span
              >
            </div>
          </div>
        </div>

        <!-- 拍摄参数 Section -->
        <div v-if="exifItems.length" class="space-y-3">
          <h4
            class="text-xs font-bold text-white uppercase tracking-widest px-1 flex items-center gap-2 whitespace-nowrap"
          >
            <Settings :size="13" />
            拍摄参数
          </h4>
          <div
            class="rounded-xl bg-slate-800/30 border border-slate-700/40 overflow-hidden max-h-96 overflow-y-auto"
          >
            <div
              v-for="(item, idx) in exifItems"
              :key="item.label"
              class="flex items-center justify-between text-xs px-4 py-2.5 hover:bg-slate-700/30 transition-all duration-150"
              :class="
                idx < exifItems.length - 1 ? 'border-b border-slate-700/20' : ''
              "
            >
              <span class="text-slate-300 whitespace-nowrap">{{
                item.label
              }}</span>
              <span class="text-white font-mono text-right font-semibold">{{
                formatExifValue(item.value)
              }}</span>
            </div>
          </div>
        </div>

        <!-- 完整 EXIF 信息 Section -->
        <div
          v-if="displayPhoto.exif && sortedExifEntries.length > 0"
          class="space-y-3 pb-4"
        >
          <details class="group">
            <summary
              class="cursor-pointer text-xs font-bold text-white uppercase tracking-widest px-1 py-2.5 hover:bg-slate-700/30 rounded-lg transition-colors duration-150 flex items-center justify-between select-none whitespace-nowrap"
            >
              <span class="flex items-center gap-2">
                <Settings :size="13" />
                <span>EXIF 数据</span>
              </span>
              <span
                class="text-xs bg-slate-700/50 px-2.5 py-1 rounded-full text-slate-200 group-open:hidden border border-slate-600/50"
                >{{ sortedExifEntries.length }}</span
              >
            </summary>
            <div
              class="mt-3 rounded-xl bg-slate-800/30 border border-slate-700/40 overflow-hidden max-h-80 overflow-y-auto"
            >
              <div
                v-for="(item, idx) in sortedExifEntries"
                :key="item[0]"
                class="flex items-start justify-between text-xs px-4 py-2.5 hover:bg-slate-700/30 transition-all duration-150 gap-3"
                :class="
                  idx < sortedExifEntries.length - 1
                    ? 'border-b border-slate-700/20'
                    : ''
                "
              >
                <span
                  class="text-slate-400 font-mono flex-shrink-0 min-w-max whitespace-nowrap"
                  >{{ getExifFieldLabel(item[0]) }}</span
                >
                <span
                  class="text-white text-right flex-shrink-0 line-clamp-2 max-w-[150px] break-words text-xs font-medium"
                >
                  {{ formatExifValue(item[1]) }}
                </span>
              </div>
            </div>
          </details>
        </div>
      
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

/* Details元素动画 */
details > summary {
  list-style: none;
}

details > summary::-webkit-details-marker {
  display: none;
}

details[open] summary span {
  display: none;
}
</style>
