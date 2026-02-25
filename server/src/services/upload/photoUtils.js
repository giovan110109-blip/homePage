/**
 * 照片相关工具函数
 */

const fs = require("fs").promises;
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const LIVEPHOTO_MAX_VIDEO_SIZE = 12 * 1024 * 1024;
const LIVEPHOTO_MAX_TIME_DIFF_MS = 10 * 60 * 1000;

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
  ".webp",
  ".gif",
  ".tiff",
  ".tif",
];

async function getVideoDurationSeconds(filePath) {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: 5000 }
    );
    const duration = parseFloat(String(stdout).trim());
    return Number.isFinite(duration) ? duration : null;
  } catch (error) {
    return null;
  }
}

async function isLikelyLiveVideo(videoPath, imageDateTaken, taskCreatedAt) {
  try {
    const stats = await fs.stat(videoPath);
    if (stats.size > LIVEPHOTO_MAX_VIDEO_SIZE) return false;

    const refTime = imageDateTaken || taskCreatedAt;
    if (refTime) {
      const diff = Math.abs(stats.mtimeMs - new Date(refTime).getTime());
      if (diff > LIVEPHOTO_MAX_TIME_DIFF_MS) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function extractBaseName(task) {
  return (
    task.baseName ||
    (task.storageKey
      ? task.storageKey
          .replace(/_\d{13}(?=\.[^.]+$)/, "")
          .replace(/\.[^.]+$/, "")
      : "") ||
    (task.originalFileName
      ? task.originalFileName.replace(/\.[^/.]+$/, "")
      : "")
  );
}

function detectFileType(task) {
  const path = require("path");
  const storageExt = path.extname(task.storageKey || "").toLowerCase();
  const originalExt = path
    .extname(task.originalFileName || "")
    .toLowerCase();

  const isImageByExt =
    IMAGE_EXTENSIONS.includes(storageExt) || IMAGE_EXTENSIONS.includes(originalExt);
  const isVideoByExt =
    VIDEO_EXTENSIONS.includes(storageExt) || VIDEO_EXTENSIONS.includes(originalExt);

  const isImage = task.mimeType?.startsWith("image/") || isImageByExt;
  const isVideo =
    task.mimeType?.startsWith("video/") || (isVideoByExt && !isImage);

  return { isImage, isVideo, storageExt, originalExt };
}

module.exports = {
  getVideoDurationSeconds,
  isLikelyLiveVideo,
  extractBaseName,
  detectFileType,
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  LIVEPHOTO_MAX_VIDEO_SIZE,
  LIVEPHOTO_MAX_TIME_DIFF_MS,
};
