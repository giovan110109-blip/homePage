const Moment = require("../models/moment");
const Photo = require("../models/photo");
  const Comment = require("../models/comment");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const { Response } = require("../utils/response");
const {
  NotFoundError,
  ValidationError,
  InternalError,
} = require("../utils/errors");
const uploadQueue = require("../services/uploadQueueManager");
const geocoding = require("../services/geocoding");

class MomentController {
  async getMoments(ctx) {
    try {
      const { page = 1, limit = 10 } = ctx.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = { status: "published", visibility: "public" };

      const [moments, total] = await Promise.all([
        Moment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Moment.countDocuments(query),
      ]);

      const momentIds = moments.map(m => m._id.toString());
      const commentCounts = await Comment.aggregate([
        { $match: { targetId: { $in: momentIds }, status: "approved" } },
        { $group: { _id: "$targetId", count: { $sum: 1 } } }
      ]);
      const commentCountMap = {};
      commentCounts.forEach(c => {
        commentCountMap[c._id] = c.count;
      });

      const momentsWithComments = moments.map(m => ({
        ...m,
        comments: commentCountMap[m._id.toString()] || 0,
      }));

      const result = {
        data: momentsWithComments,
        meta: {
          page: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pageCount: Math.ceil(total / parseInt(limit)),
        },
      };

      ctx.body = Response.success(result, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getMomentDetail(ctx) {
    try {
      const { id } = ctx.params;
      const moment = await Moment.findById(id).lean();

      if (!moment) {
        throw new NotFoundError("说说不存在");
      }

      ctx.body = Response.success(moment, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async createMoment(ctx) {
    try {
      const {
        content,
        type = "text",
        mode = "livePhoto",
        media = [],
        livePhoto,
        video,
        location,
      } = ctx.request.body;
                                                                                                                                                                                                                                                                                                                                                                                                  
      if (!content && (!media || media.length === 0) && !livePhoto && !video) {
        throw new ValidationError("内容不能为空");
      }

      let momentType = type;
      if (video) {
        momentType = "video";
      } else if (media && media.length > 0) {
        momentType = "image";
      }

      const momentData = {
        content,
        type: momentType,
        mode,
        media: [],
        author: {
          _id: ctx.state.user?._id,
          name: ctx.state.user?.nickname || ctx.state.user?.username || "Admin",
          avatar: ctx.state.user?.avatar,
        },
      };

      if (media && media.length > 0) {
        for (const item of media) {
          momentData.media.push({
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            thumbHash: item.thumbHash,
            width: item.width,
            height: item.height,
            photoId: item.photoId,
            isPrivate: item.isPrivate !== false,
            isLive: item.isLive || false,
            videoUrl: item.videoUrl,
          });
        }
      }

      if (livePhoto) {
        momentData.livePhoto = {
          imageUrl: livePhoto.imageUrl,
          videoUrl: livePhoto.videoUrl,
          imagePhotoId: livePhoto.imagePhotoId,
          videoPhotoId: livePhoto.videoPhotoId,
          width: livePhoto.width,
          height: livePhoto.height,
        };
      }

      if (video) {
        momentData.video = {
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          width: video.width,
          height: video.height,
          storageKey: video.storageKey,
        };
      }

      if (location) {
        momentData.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          address: location.address,
        };
      }

      const moment = new Moment(momentData);
      await moment.save();

      ctx.body = Response.success(moment, "创建成功");
    } catch (error) {
      throw error;
    }
  }

  async updateMoment(ctx) {
    try {
      const { id } = ctx.params;
      const updates = ctx.request.body;

      const allowedFields = [
        "content",
        "type",
        "mode",
        "media",
        "livePhoto",
        "video",
        "location",
        "visibility",
        "status",
      ];

      const filteredUpdates = {};
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const moment = await Moment.findByIdAndUpdate(id, filteredUpdates, {
        new: true,
        runValidators: true,
      });

      if (!moment) {
        throw new NotFoundError("说说不存在");
      }

      ctx.body = Response.success(moment, "更新成功");
    } catch (error) {
      throw error;
    }
  }

  async deleteMoment(ctx) {
    try {
      const { id } = ctx.params;
      const moment = await Moment.findById(id);

      if (!moment) {
        throw new NotFoundError("说说不存在");
      }

      if (moment.video?.storageKey) {
        const baseUploadDir =
          process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
        const videoDir = path.join(baseUploadDir, "moments");
        await fsp.unlink(path.join(videoDir, moment.video.storageKey)).catch(() => {});
      }

      await Moment.deleteOne({ _id: id });

      ctx.body = Response.success(null, "删除成功");
    } catch (error) {
      throw error;
    }
  }

  async uploadMedia(ctx) {
    try {
      const file = ctx.request.files?.file;
      const { mode = "livePhoto" } = ctx.query;

      if (!file) {
        throw new ValidationError("请选择要上传的文件");
      }

      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

      if (mode === "video") {
        const videoDir = path.join(baseUploadDir, "moments");
        await fsp.mkdir(videoDir, { recursive: true });

        const originalName =
          file.originalFilename || file.name || file.newFilename || "unknown";
        const ext = path.extname(originalName);
        const timestamp = Date.now();
        const filename = `moment_${timestamp}${ext}`;
        const filePath = path.join(videoDir, filename);

        const tempPath = file.filepath || file.path;
        if (!tempPath) {
          throw new InternalError("无法获取上传文件的临时路径");
        }

        await fsp.copyFile(tempPath, filePath);
        await fsp.unlink(tempPath).catch(() => {});

        const videoUrl = `/uploads/moments/${filename}`;

        ctx.body = Response.success(
          {
            url: videoUrl,
            storageKey: filename,
            originalFileName: originalName,
            fileSize: file.size,
          },
          "上传成功"
        );
      } else {
        const uploadDir = path.join(baseUploadDir, "photos");
        await fsp.mkdir(uploadDir, { recursive: true });

        const originalName =
          file.originalFilename || file.name || file.newFilename || "unknown";
        const ext = path.extname(originalName);
        const baseName = path.parse(originalName).name;
        const timestamp = Date.now();
        const filename = `${baseName}_${timestamp}${ext}`;
        const filePath = path.join(uploadDir, filename);

        const tempPath = file.filepath || file.path;
        if (!tempPath) {
          throw new InternalError("无法获取上传文件的临时路径");
        }

        await fsp.copyFile(tempPath, filePath);
        await fsp.unlink(tempPath).catch(() => {});

        const taskData = {
          originalFileName: originalName,
          fileSize: file.size,
          mimeType: file.mimetype || file.type || file.mimeType,
          storageKey: filename,
          priority: 0,
          baseName,
          isPrivate: true,
        };

        if (ctx.state.user?._id) {
          taskData.uploadedBy = ctx.state.user._id;
        }

        const task = await uploadQueue.createTask(taskData);

        ctx.body = Response.success(
          {
            taskId: task.taskId,
            filename,
            status: task.status,
          },
          "上传成功，开始处理"
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async getGalleryPhotos(ctx) {
    try {
      const { page = 1, limit = 20, search } = ctx.query;

      const query = { status: "completed" };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { originalFileName: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [photos, total] = await Promise.all([
        Photo.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select(
            "_id originalUrl originalFileUrl thumbnailUrl thumbnailHash isLive videoUrl width height originalFileName"
          )
          .lean(),
        Photo.countDocuments(query),
      ]);

      ctx.body = Response.success(
        {
          data: photos,
          meta: {
            page: parseInt(page),
            pageSize: parseInt(limit),
            total,
          },
        },
        "获取成功"
      );
    } catch (error) {
      throw error;
    }
  }

  async reverseGeocode(ctx) {
    try {
      const { latitude, longitude } = ctx.query;

      if (!latitude || !longitude) {
        throw new ValidationError("请提供经纬度");
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        throw new ValidationError("无效的经纬度");
      }

      const geoinfo = await geocoding.reverseGeocode(lat, lng);

      if (!geoinfo) {
        ctx.body = Response.success(
          {
            latitude: lat,
            longitude: lng,
            name: "未知位置",
            address: "",
          },
          "无法获取位置信息"
        );
        return;
      }

      ctx.body = Response.success(
        {
          latitude: lat,
          longitude: lng,
          name: geoinfo.city || geoinfo.province || geoinfo.displayName,
          address: geoinfo.displayName,
          ...geoinfo,
        },
        "获取成功"
      );
    } catch (error) {
      throw error;
    }
  }

  async getAdminMoments(ctx) {
    try {
      const { page = 1, limit = 10, status } = ctx.query;

      const query = {};
      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [moments, total] = await Promise.all([
        Moment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Moment.countDocuments(query),
      ]);

      ctx.body = Response.success(
        {
          data: moments,
          meta: {
            page: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pageCount: Math.ceil(total / parseInt(limit)),
          },
        },
        "获取成功"
      );
    } catch (error) {
      throw error;
    }
  }

  async likeMoment(ctx) {
    try {
      const { id } = ctx.params;
      
      const moment = await Moment.findById(id);
      if (!moment) {
        throw new NotFoundError("说说不存在");
      }

      moment.likes = (moment.likes || 0) + 1;
      await moment.save();

      ctx.body = Response.success({ likes: moment.likes }, "点赞成功");
    } catch (error) {
      throw error;
    }
  }

  async reactMoment(ctx) {
    try {
      const { id } = ctx.params;
      const { type, action = "add" } = ctx.request.body;

      if (!type) {
        throw new ValidationError("请选择表态类型");
      }

      const reactionService = require("../services/reactionService");
      const ip = ctx.ip || ctx.request.ip;
      const counts = await reactionService.handleReact("moment", id, type, ip, action);

      ctx.body = Response.success(counts, "表态成功");
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MomentController();
