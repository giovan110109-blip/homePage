/**
 * 上传模块入口
 */

const photoUtils = require("./photoUtils");
const VideoProcessor = require("./videoProcessor");
const ImageProcessor = require("./imageProcessor");

module.exports = {
  ...photoUtils,
  VideoProcessor,
  ImageProcessor,
};
