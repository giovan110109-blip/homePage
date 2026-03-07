const { FileChunk, FileUpload } = require('../models/FileUpload')
const FileItem = require('../models/FileItem')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const fsp = fs.promises
const crypto = require('crypto')
const websocketService = require('../../services/websocket')
const imageProcessing = require('../../services/imageProcessing')

const CHUNK_SIZE = 5 * 1024 * 1024

class UploadController {
  async initUpload(ctx) {
    try {
      const { fileName, fileSize, fileHash, mimeType, parentId } = ctx.request.body
      const userId = ctx.state.user._id

      if (!fileName || !fileSize) {
        ctx.status = 400
        ctx.body = { success: false, message: '文件名和文件大小不能为空' }
        return
      }

      const uploadId = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)

      if (fileHash) {
        const existingFile = await FileItem.findOne({
          owner: userId,
          storageKey: { $regex: fileHash },
          isDeleted: false
        })

        if (existingFile) {
          const newFile = await FileItem.create({
            name: fileName,
            type: 'file',
            size: fileSize,
            mimeType: mimeType || 'application/octet-stream',
            extension: fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : null,
            parentId: parentId || null,
            path: '/',
            storageKey: existingFile.storageKey,
            owner: userId
          })

          ctx.body = {
            success: true,
            data: {
              uploadId,
              status: 'completed',
              fileId: newFile._id,
              message: '秒传成功'
            }
          }
          return
        }
      }

      const upload = await FileUpload.create({
        uploadId,
        fileName,
        fileSize,
        fileHash,
        mimeType: mimeType || 'application/octet-stream',
        chunkSize: CHUNK_SIZE,
        totalChunks,
        uploadedChunks: [],
        parentId: parentId || null,
        owner: userId
      })

      ctx.body = {
        success: true,
        data: {
          uploadId,
          chunkSize: CHUNK_SIZE,
          totalChunks,
          uploadedChunks: [],
          status: 'uploading'
        }
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = { success: false, message: error.message }
    }
  }

  async uploadChunk(ctx) {
    try {
      const { uploadId, chunkIndex, chunkHash } = ctx.request.body
      const chunkFile = ctx.request.files?.chunk
      const userId = ctx.state.user._id

      if (!uploadId || chunkIndex === undefined || !chunkFile) {
        ctx.status = 400
        ctx.body = { success: false, message: '缺少必要参数' }
        return
      }

      const upload = await FileUpload.findOne({ uploadId, owner: userId })
      if (!upload) {
        ctx.status = 404
        ctx.body = { success: false, message: '上传任务不存在' }
        return
      }

      if (upload.status !== 'uploading') {
        ctx.status = 400
        ctx.body = { success: false, message: '上传任务已结束' }
        return
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const chunksDir = path.join(baseUploadDir, 'chunks', uploadId)
      await fsp.mkdir(chunksDir, { recursive: true })

      const chunkStorageKey = `${chunkIndex}`
      const chunkPath = path.join(chunksDir, chunkStorageKey)

      const tempPath = chunkFile.filepath || chunkFile.path
      await fsp.copyFile(tempPath, chunkPath)
      await fsp.unlink(tempPath).catch(() => {})

      const stats = await fsp.stat(chunkPath)

      await FileChunk.findOneAndUpdate(
        { uploadId, chunkIndex },
        {
          uploadId,
          chunkIndex: parseInt(chunkIndex),
          chunkHash: chunkHash || '',
          chunkSize: stats.size,
          storageKey: chunkStorageKey
        },
        { upsert: true }
      )

      if (!upload.uploadedChunks.includes(parseInt(chunkIndex))) {
        upload.uploadedChunks.push(parseInt(chunkIndex))
        await upload.save()
      }

      const progress = upload.getProgress()
      await websocketService.broadcast(userId, {
        type: 'upload:progress',
        uploadId,
        progress,
        chunkIndex: parseInt(chunkIndex),
        uploadedChunks: upload.uploadedChunks.length,
        totalChunks: upload.totalChunks
      })

      ctx.body = {
        success: true,
        data: {
          chunkIndex: parseInt(chunkIndex),
          progress,
          uploadedChunks: upload.uploadedChunks
        }
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = { success: false, message: error.message }
    }
  }

  async completeUpload(ctx) {
    try {
      const { uploadId } = ctx.request.body
      const userId = ctx.state.user._id

      const upload = await FileUpload.findOne({ uploadId, owner: userId })
      if (!upload) {
        ctx.status = 404
        ctx.body = { success: false, message: '上传任务不存在' }
        return
      }

      if (upload.uploadedChunks.length !== upload.totalChunks) {
        ctx.status = 400
        ctx.body = {
          success: false,
          message: '分片未上传完成',
          data: {
            missingChunks: upload.getMissingChunks()
          }
        }
        return
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const chunksDir = path.join(baseUploadDir, 'chunks', uploadId)
      const filesDir = path.join(baseUploadDir, 'files')
      const thumbnailDir = path.join(baseUploadDir, 'thumbnails')
      await fsp.mkdir(filesDir, { recursive: true })
      await fsp.mkdir(thumbnailDir, { recursive: true })

      const ext = upload.fileName.includes('.') ? '.' + upload.fileName.split('.').pop() : ''
      const baseName = upload.fileName.includes('.') ? upload.fileName.split('.').slice(0, -1).join('.') : upload.fileName
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const storageKey = `${baseName}_${timestamp}_${randomStr}${ext}`
      const filePath = path.join(filesDir, storageKey)

      const writeStream = fs.createWriteStream(filePath)
      
      for (let i = 0; i < upload.totalChunks; i++) {
        const chunkPath = path.join(chunksDir, String(i))
        const chunkData = await fsp.readFile(chunkPath)
        writeStream.write(chunkData)
        await fsp.unlink(chunkPath).catch(() => {})
      }
      
      writeStream.end()

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      })

      await fsp.rmdir(chunksDir).catch(() => {})

      const stats = await fsp.stat(filePath)
      
      let thumbnailKey = null
      let thumbnailUrl = null
      
      if (upload.mimeType && upload.mimeType.startsWith('image/')) {
        try {
          const imageBuffer = await fsp.readFile(filePath)
          const thumbnailBuffer = await imageProcessing.generateThumbnail(imageBuffer, {
            width: 300,
            height: 300,
            fit: 'inside',
            quality: 80,
            format: 'webp'
          })
          
          thumbnailKey = `${baseName}_${timestamp}_${randomStr}.webp`
          const thumbnailPath = path.join(thumbnailDir, thumbnailKey)
          await fsp.writeFile(thumbnailPath, thumbnailBuffer)
          
          const thumbHash = await imageProcessing.generateThumbHash(imageBuffer)
          if (thumbHash) {
            thumbnailUrl = await imageProcessing.thumbHashToDataURL(thumbHash)
          }
        } catch (thumbError) {
          console.warn('生成缩略图失败:', thumbError.message)
        }
      }

      const fileItem = await FileItem.create({
        name: upload.fileName,
        type: 'file',
        size: stats.size,
        mimeType: upload.mimeType,
        extension: ext.replace('.', ''),
        parentId: upload.parentId,
        path: '/',
        storageKey,
        thumbnailKey,
        thumbnailUrl,
        owner: userId
      })

      upload.status = 'completed'
      upload.fileId = fileItem._id
      upload.completedAt = new Date()
      await upload.save()

      await FileChunk.deleteMany({ uploadId })

      await websocketService.broadcast(userId, {
        type: 'upload:completed',
        uploadId,
        fileId: fileItem._id,
        fileName: fileItem.name
      })

      ctx.body = {
        success: true,
        data: fileItem,
        message: '文件上传成功'
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = { success: false, message: error.message }
    }
  }

  async getUploadStatus(ctx) {
    try {
      const { uploadId } = ctx.params
      const userId = ctx.state.user._id

      const upload = await FileUpload.findOne({ uploadId, owner: userId })
      if (!upload) {
        ctx.status = 404
        ctx.body = { success: false, message: '上传任务不存在' }
        return
      }

      ctx.body = {
        success: true,
        data: {
          uploadId: upload.uploadId,
          fileName: upload.fileName,
          fileSize: upload.fileSize,
          totalChunks: upload.totalChunks,
          uploadedChunks: upload.uploadedChunks,
          progress: upload.getProgress(),
          status: upload.status,
          fileId: upload.fileId
        }
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = { success: false, message: error.message }
    }
  }

  async cancelUpload(ctx) {
    try {
      const { uploadId } = ctx.request.body
      const userId = ctx.state.user._id

      const upload = await FileUpload.findOne({ uploadId, owner: userId })
      if (!upload) {
        ctx.status = 404
        ctx.body = { success: false, message: '上传任务不存在' }
        return
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const chunksDir = path.join(baseUploadDir, 'chunks', uploadId)
      await fsp.rm(chunksDir, { recursive: true, force: true }).catch(() => {})

      await FileChunk.deleteMany({ uploadId })
      await FileUpload.deleteOne({ uploadId })

      await websocketService.broadcast(userId, {
        type: 'upload:cancelled',
        uploadId
      })

      ctx.body = {
        success: true,
        message: '上传已取消'
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = { success: false, message: error.message }
    }
  }
}

module.exports = new UploadController()
