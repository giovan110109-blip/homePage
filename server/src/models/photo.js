const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    // 基本信息
    title: String,
    description: String,

    // 文件信息
    originalFileName: { type: String, required: true },
    baseName: String, // 文件基础名（不含扩展名）
    storageKey: { type: String, required: true, unique: true },
    thumbnailKey: String,
    fileSize: Number,
    mimeType: String,

    // 图片尺寸
    width: Number,
    height: Number,
    aspectRatio: Number,

    // URL
    originalUrl: String, // WebP 缩略图或原始文件访问地址
    originalFileUrl: String, // 原始文件访问地址（高分辨率）
    originalKey: String, // 原始文件存储 key
    thumbnailUrl: String,
    thumbnailHash: String, // ThumbHash 用于模糊占位图

    // Live Photo
    isLive: { type: Boolean, default: false },
    videoUrl: String,
    videoKey: String,

    // EXIF 元数据
    exif: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 拍摄日期
    dateTaken: Date,
    dateDigitized: Date,
    dateModified: Date,

    // 地理位置信息
    location: {
      latitude: Number,
      longitude: Number,
      altitude: Number,
      // 地理位置数组 [longitude, latitude] for MongoDB geospatial queries
      coordinates: {
        type: [Number],
      },
    },

    // 反向地理编码信息
    geoinfo: {
      country: String,
      countryCode: String,
      region: String,
      city: String,
      locationName: String,
      formatted: String,
    },

    // 相机信息
    camera: {
      make: String,
      model: String,
      lens: String,
      focalLength: String,
      aperture: String,
      shutterSpeed: String,
      iso: Number,
      flash: String,
      exposureProgram: String,
    },

    // 标签和分类
    tags: [String],
    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],

    // 状态
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    // 可见性
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // 统计信息
    views: { type: Number, default: 0 },

    // 排序字段 - 用于前端稳定渲染
    sort: { type: Number, default: 0, index: true },

    // 处理信息
    processingError: String,
    processingStage: String,

    // 上传者
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

// 索引优化
photoSchema.index({ dateTaken: -1 });
photoSchema.index({ "location.coordinates": "2dsphere" });
photoSchema.index({ tags: 1 });
photoSchema.index({ status: 1 });
photoSchema.index({ visibility: 1 });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ albums: 1 });
photoSchema.index({ sort: -1 });
photoSchema.index({ status: 1, visibility: 1 });
photoSchema.index({ status: 1, createdAt: -1 });
photoSchema.index({ status: 1, visibility: 1, createdAt: -1 });

module.exports = mongoose.model("Photo", photoSchema);
