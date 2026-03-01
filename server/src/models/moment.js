const mongoose = require("mongoose");

const momentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },

    type: {
      type: String,
      enum: ["text", "image", "video", "live"],
      default: "text",
    },

    mode: {
      type: String,
      enum: ["livePhoto", "video"],
      default: "livePhoto",
    },

    media: [
      {
        url: { type: String, required: true },
        thumbnailUrl: String,
        thumbHash: String,
        width: Number,
        height: Number,
        photoId: { type: mongoose.Schema.Types.ObjectId, ref: "Photo" },
        isPrivate: { type: Boolean, default: false },
        isLive: { type: Boolean, default: false },
        videoUrl: String,
      },
    ],

    livePhoto: {
      imageUrl: String,
      videoUrl: String,
      imagePhotoId: { type: mongoose.Schema.Types.ObjectId, ref: "Photo" },
      videoPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: "Photo" },
      width: Number,
      height: Number,
    },

    video: {
      url: String,
      thumbnailUrl: String,
      duration: Number,
      width: Number,
      height: Number,
      storageKey: String,
    },

    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      address: String,
    },

    author: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      avatar: String,
    },

    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false },

    reactions: {
      type: Map,
      of: Number,
      default: {},
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
  },
  {
    timestamps: true,
  }
);

momentSchema.index({ createdAt: -1 });
momentSchema.index({ status: 1, visibility: 1 });
momentSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("Moment", momentSchema);
