/**
 * 照片相关工具函数
 */

const fs = require("fs").promises;
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const LIVEPHOTO_MAX_VIDEO_SIZE = 40 * 1024 * 1024;
const LIVEPHOTO_MAX_TIME_DIFF_MS = 30 * 60 * 1000;
const LIVEPHOTO_MAX_DURATION_SECONDS = 8;

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

    const candidateTimes = [stats.birthtimeMs, stats.mtimeMs].filter(
      (value) => Number.isFinite(value) && value > 0
    );
    const referenceTimes = [taskCreatedAt, imageDateTaken]
      .map((value) => {
        if (!value) return null;
        const time = new Date(value).getTime();
        return Number.isFinite(time) ? time : null;
      })
      .filter((value) => value !== null);

    if (candidateTimes.length > 0 && referenceTimes.length > 0) {
      const minDiff = Math.min(
        ...candidateTimes.flatMap((candidateTime) =>
          referenceTimes.map((referenceTime) =>
            Math.abs(candidateTime - referenceTime)
          )
        )
      );

      if (minDiff > LIVEPHOTO_MAX_TIME_DIFF_MS) {
        return false;
      }
    }

    const durationSeconds = await getVideoDurationSeconds(videoPath);
    if (
      durationSeconds !== null &&
      durationSeconds > LIVEPHOTO_MAX_DURATION_SECONDS
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function extractBaseNameFromFilename(filename = "") {
  return path
    .basename(filename)
    .replace(/_optimized(?=\.[^.]+$)/i, "")
    .replace(/_\d{13}(?=\.[^.]+$)/, "")
    .replace(/\.[^.]+$/, "");
}

function extractBaseName(task) {
  return (
    task.baseName ||
    (task.storageKey ? extractBaseNameFromFilename(task.storageKey) : "") ||
    (task.originalFileName
      ? extractBaseNameFromFilename(task.originalFileName)
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
  extractBaseNameFromFilename,
  extractBaseName,
  detectFileType,
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  LIVEPHOTO_MAX_VIDEO_SIZE,
  LIVEPHOTO_MAX_TIME_DIFF_MS,
  LIVEPHOTO_MAX_DURATION_SECONDS,
};
