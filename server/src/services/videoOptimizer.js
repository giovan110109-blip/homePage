const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execPromise = promisify(exec);

/**
 * 视频优化服务
 * 使用 FFmpeg 进行视频压缩优化，保持高画质
 */
class VideoOptimizer {
  /**
   * 检查 FFmpeg 是否可用
   */
  async isFFmpegAvailable() {
    try {
      await execPromise('ffmpeg -version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 优化视频 - 更强压缩
   * 使用 CRF 24 (视觉无损范围 18-28，越高压缩越大)
   */
  async optimizeVideo(inputPath, outputPath) {
    const ffmpegCmd = `ffmpeg -i "${inputPath}" \
      -c:v libx264 \
      -preset medium \
      -crf 24 \
      -c:a aac \
      -b:a 128k \
      -movflags faststart \
      -y \
      "${outputPath}"`;

    try {
      console.log('开始优化视频:', inputPath);
      
      const startTime = Date.now();
      await execPromise(ffmpegCmd, { timeout: 300000 }); // 5分钟超时
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      const inputStats = await fs.stat(inputPath);
      const outputStats = await fs.stat(outputPath);
      const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`视频优化完成 (${duration}秒): ${path.basename(outputPath)}`);
      console.log(`  原始: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  优化: ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  压缩: ${compressionRatio}%`);
      
      return {
        success: true,
        outputPath,
        originalSize: inputStats.size,
        optimizedSize: outputStats.size,
        compressionRatio: parseFloat(compressionRatio),
        duration
      };
    } catch (error) {
      console.error('视频优化失败:', error.message);
      
      // 清理失败的输出文件
      await fs.unlink(outputPath).catch(() => {});
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 快速优化 MOV 为 MP4
   * 对于已经是 H.264 编码的视频，只重新封装容器
   */
  async quickOptimizeMOV(inputPath, outputPath) {
    // 先检查视频编码格式
    const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    
    try {
      const { stdout } = await execPromise(probeCmd);
      const codec = stdout.trim();
      
      // 如果已经是 H.264，只重新封装
      if (codec === 'h264') {
        console.log('视频已是 H.264 编码，快速重新封装...');
        const remuxCmd = `ffmpeg -i "${inputPath}" -c copy -movflags faststart -y "${outputPath}"`;
        await execPromise(remuxCmd, { timeout: 60000 });
        
        const inputStats = await fs.stat(inputPath);
        const outputStats = await fs.stat(outputPath);
        
        console.log(`快速优化完成: ${path.basename(outputPath)}`);
        console.log(`  大小: ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`);
        
        return {
          success: true,
          outputPath,
          originalSize: inputStats.size,
          optimizedSize: outputStats.size,
          method: 'remux'
        };
      }
      
      // 否则进行完整转码
      return await this.optimizeVideo(inputPath, outputPath);
    } catch (error) {
      // 如果检测失败，降级到完整转码
      console.warn('视频编码检测失败，使用完整转码:', error.message);
      return await this.optimizeVideo(inputPath, outputPath);
    }
  }
}

module.exports = new VideoOptimizer();
