const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs").promises;

const execFileAsync = promisify(execFile);

const LIVEPHOTO_MAX_VIDEO_SIZE = 12 * 1024 * 1024;
const LIVEPHOTO_MAX_TIME_DIFF_MS = 10 * 60 * 1000;

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
      { timeout: 5000 },
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

module.exports = {
  getVideoDurationSeconds,
  isLikelyLiveVideo,
  LIVEPHOTO_MAX_VIDEO_SIZE,
  LIVEPHOTO_MAX_TIME_DIFF_MS,
};
