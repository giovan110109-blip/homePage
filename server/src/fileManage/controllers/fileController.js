const BaseController = require('../../utils/baseController');
const { HttpStatus } = require('../../utils/response');
const FileItem = require('../models/FileItem')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const fsp = fs.promises
const imageProcessing = require('../../services/imageProcessing')

const getVideoMetadata = async (filePath) => {
  return new Promise((resolve) => {
    const ffprobe = require('child_process').spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ])

    let output = ''
    ffprobe.stdout.on('data', (data) => {
      output += data.toString()
    })

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        resolve(null)
        return
      }

      try {
        const data = JSON.parse(output)
        const videoStream = data.streams?.find(s => s.codec_type === 'video')
        
        if (videoStream) {
          resolve({
            width: videoStream.width,
            height: videoStream.height,
            duration: parseFloat(data.format?.duration || videoStream.duration || 0),
            bitrate: parseInt(data.format?.bit_rate || 0),
            codec: videoStream.codec_name
          })
        } else {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    })

    ffprobe.on('error', () => resolve(null))
  })
}

const formatItem = (item) => {
  const obj = item._doc || item
  const { password, ...rest } = obj
  return {
    ...rest,
    id: obj._id.toString(),
    hasPassword: !!password,
    hasThumbnail: !!obj.thumbnailKey
  }
}

const dedupeItemsById = (items) => {
  const itemMap = new Map()

  for (const item of items) {
    if (!item?._id) continue
    itemMap.set(String(item._id), item)
  }

  return Array.from(itemMap.values())
}

class FileController extends BaseController {
  async getDescendantItems(parentIds, userId, options = {}) {
    let currentParentIds = parentIds.filter(Boolean)
    const descendants = []

    while (currentParentIds.length > 0) {
      const query = {
        parentId: { $in: currentParentIds },
        owner: userId
      }

      if (typeof options.isDeleted === 'boolean') {
        query.isDeleted = options.isDeleted
      }

      const children = await FileItem.find(query).lean()
      if (children.length === 0) {
        break
      }

      descendants.push(...children)
      currentParentIds = children
        .filter(item => item.type === 'folder')
        .map(item => item._id)
    }

    return descendants
  }

  async collectItemsWithDescendants(rootItems, userId, options = {}) {
    const folderIds = rootItems
      .filter(item => item.type === 'folder')
      .map(item => item._id)

    if (folderIds.length === 0) {
      return dedupeItemsById(rootItems)
    }

    const descendants = await this.getDescendantItems(folderIds, userId, options)
    return dedupeItemsById([...rootItems, ...descendants])
  }

  async deleteStoredFiles(items) {
    const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    const filesDir = path.join(baseUploadDir, 'files')
    const thumbnailDir = path.join(baseUploadDir, 'thumbnails')
    const filePaths = new Set()

    for (const item of items) {
      if (item.type === 'file' && item.storageKey) {
        filePaths.add(path.join(filesDir, item.storageKey))
      }

      if (Array.isArray(item.versions)) {
        item.versions.forEach(version => {
          if (version?.storageKey) {
            filePaths.add(path.join(filesDir, version.storageKey))
          }
        })
      }

      if (item.thumbnailKey) {
        filePaths.add(path.join(thumbnailDir, item.thumbnailKey))
      }
    }

    await Promise.all(
      Array.from(filePaths).map(filePath => fsp.unlink(filePath).catch(() => {}))
    )
  }

  async list(ctx) {
    try {
      const { folderId } = ctx.query
      const userId = ctx.state.user._id

      let parentFolder = null
      if (folderId && folderId !== 'null' && folderId !== 'root') {
        parentFolder = await FileItem.findById(folderId).lean()
      }

      const query = {
        isDeleted: false,
        $or: [
          { owner: new mongoose.Types.ObjectId(userId) },
          { isPrivate: false }
        ]
      }

      if (parentFolder) {
        query.parentId = new mongoose.Types.ObjectId(folderId)
      } else {
        query.parentId = null
      }

      const items = await FileItem.find(query)
        .sort({ type: 1, name: 1 })
        .lean()

      const data = items.map(formatItem)

      this.ok(ctx, {
        data,
        parentFolder: parentFolder ? formatItem(parentFolder) : null
      })
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async createFolder(ctx) {
    try {
      const { name, parentId, password, isPrivate } = ctx.request.body
      const userId = ctx.state.user._id

      if (!name || !name.trim()) {
        this.throwHttpError('文件夹名称不能为空', HttpStatus.BAD_REQUEST)
      }

      const parentPath = '/'
      if (parentId) {
        const parent = await FileItem.findById(parentId)
        if (!parent || parent.type !== 'folder') {
          this.throwHttpError('父文件夹不存在', HttpStatus.BAD_REQUEST)
        }
      }

      const existingFolder = await FileItem.findOne({
        name: name.trim(),
        parentId: parentId || null,
        owner: userId,
        isDeleted: false
      })

      if (existingFolder) {
        this.throwHttpError('同名文件夹已存在', HttpStatus.BAD_REQUEST)
      }

      const folderData = {
        name: name.trim(),
        type: 'folder',
        parentId: parentId || null,
        path: parentPath,
        owner: userId,
        isPrivate: isPrivate || false
      }

      if (password && password.trim()) {
        const bcrypt = require('bcryptjs')
        folderData.password = await bcrypt.hash(password.trim(), 10)
      }

      const folder = await FileItem.create(folderData)

      const folderResponse = formatItem(folder)
      folderResponse.hasPassword = !!folder.password

      this.ok(ctx, folderResponse, '文件夹创建成功')
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async rename(ctx) {
    try {
      const { id } = ctx.params
      const { name } = ctx.request.body
      const userId = ctx.state.user._id

      if (!name || !name.trim()) {
        this.throwHttpError('名称不能为空', HttpStatus.BAD_REQUEST)
      }

      const item = await FileItem.findOne({
        _id: id,
        owner: userId,
        isDeleted: false
      })

      if (!item) {
        this.throwHttpError('文件或文件夹不存在', HttpStatus.NOT_FOUND)
      }

      const existing = await FileItem.findOne({
        name: name.trim(),
        parentId: item.parentId,
        owner: userId,
        isDeleted: false,
        _id: { $ne: id }
      })

      if (existing) {
        this.throwHttpError('同名文件或文件夹已存在', HttpStatus.BAD_REQUEST)
      }

      item.name = name.trim()
      await item.save()

      this.ok(ctx, formatItem(item), '重命名成功')
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async delete(ctx) {
    try {
      const { ids } = ctx.request.body
      const userId = ctx.state.user._id

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        this.throwHttpError('请选择要删除的文件或文件夹', HttpStatus.BAD_REQUEST)
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id))

      const items = await FileItem.find({
        _id: { $in: objectIds },
        owner: userId,
        isDeleted: false
      })

      if (items.length === 0) {
        this.throwHttpError('未找到要删除的文件', HttpStatus.NOT_FOUND)
      }

      const allItems = await this.collectItemsWithDescendants(items, userId, {
        isDeleted: false
      })
      const now = new Date()
      await FileItem.bulkWrite(
        allItems.map(item => ({
          updateOne: {
            filter: { _id: item._id, owner: userId },
            update: {
              $set: {
                isDeleted: true,
                trashInfo: {
                  deletedAt: now,
                  deletedBy: userId,
                  originalPath: item.path
                }
              }
            }
          }
        }))
      )

      this.ok(ctx, null, `已将 ${allItems.length} 个项目移入回收站`)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getTrash(ctx) {
    try {
      const userId = ctx.state.user._id

      const items = await FileItem.findDeleted(userId)

      this.ok(ctx, items.map(formatItem))
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async restore(ctx) {
    try {
      const { ids } = ctx.request.body
      const userId = ctx.state.user._id

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        this.throwHttpError('请选择要恢复的文件', HttpStatus.BAD_REQUEST)
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id))
      const items = await FileItem.find({
        _id: { $in: objectIds },
        owner: userId,
        isDeleted: true
      }).lean()

      if (items.length === 0) {
        this.throwHttpError('未找到要恢复的文件', HttpStatus.NOT_FOUND)
      }

      const allItems = await this.collectItemsWithDescendants(items, userId, {
        isDeleted: true
      })

      const result = await FileItem.updateMany(
        {
          _id: { $in: allItems.map(item => item._id) },
          owner: userId,
          isDeleted: true
        },
        {
          isDeleted: false,
          $unset: { trashInfo: 1 }
        }
      )

      this.ok(ctx, null, `已恢复 ${result.modifiedCount} 个项目`)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async permanentDelete(ctx) {
    try {
      const { ids } = ctx.request.body
      const userId = ctx.state.user._id

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        this.throwHttpError('请选择要永久删除的文件', HttpStatus.BAD_REQUEST)
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id))

      const items = await FileItem.find({
        _id: { $in: objectIds },
        owner: userId,
        isDeleted: true
      }
      ).lean()

      if (items.length === 0) {
        this.throwHttpError('未找到要永久删除的文件', HttpStatus.NOT_FOUND)
      }

      const allItems = await this.collectItemsWithDescendants(items, userId)
      await this.deleteStoredFiles(allItems)

      await FileItem.deleteMany({
        _id: { $in: allItems.map(item => item._id) },
        owner: userId
      })

      this.ok(ctx, null, `已永久删除 ${allItems.length} 个项目`)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async search(ctx) {
    try {
      const { keyword, type } = ctx.query
      const userId = ctx.state.user._id

      if (!keyword) {
        return this.ok(ctx, [])
      }

      const items = await FileItem.search(userId, keyword, { type })

      this.ok(ctx, items)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async toggleFavorite(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const item = await FileItem.findOne({
        _id: id,
        owner: userId,
        isDeleted: false
      })

      if (!item) {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      item.isFavorite = !item.isFavorite
      await item.save()

      this.ok(ctx, { isFavorite: item.isFavorite }, item.isFavorite ? '已添加到收藏' : '已取消收藏')
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getFavorites(ctx) {
    try {
      const userId = ctx.state.user._id

      const items = await FileItem.find({
        owner: userId,
        isFavorite: true,
        isDeleted: false
      }).sort({ updatedAt: -1 }).lean()

      this.ok(ctx, items.map(formatItem))
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getTree(ctx) {
    try {
      const userId = ctx.state.user._id

      const folders = await FileItem.find({
        owner: userId,
        type: 'folder',
        isDeleted: false
      }).sort({ name: 1 }).lean()

      const formatFolder = (folder) => {
        const { password, ...rest } = folder
        return {
          ...rest,
          id: folder._id.toString(),
          hasPassword: !!password
        }
      }

      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => String(item.parentId) === String(parentId))
          .map(item => ({
            ...formatFolder(item),
            children: buildTree(items, item._id)
          }))
      }

      const tree = buildTree(folders)

      this.ok(ctx, tree)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async upload(ctx) {
    try {
      const file = ctx.request.files?.file
      const { folderId, relativePath } = ctx.request.body
      const userId = ctx.state.user._id

      if (!file) {
        this.throwHttpError('请选择要上传的文件', HttpStatus.BAD_REQUEST)
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const uploadDir = path.join(baseUploadDir, 'files')
      const thumbnailDir = path.join(baseUploadDir, 'thumbnails')
      await fsp.mkdir(uploadDir, { recursive: true })
      await fsp.mkdir(thumbnailDir, { recursive: true })

      let originalName = file.originalFilename || file.name || 'unknown'
      if (originalName.includes('/')) {
        originalName = originalName.split('/').pop()
      }
      const ext = path.extname(originalName)
      const baseName = path.parse(originalName).name
      
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const storageKey = `${baseName}_${timestamp}_${randomStr}${ext}`
      const filePath = path.join(uploadDir, storageKey)

      const tempPath = file.filepath || file.path
      await fsp.copyFile(tempPath, filePath)
      await fsp.unlink(tempPath).catch(() => {})

      const stats = await fsp.stat(filePath)
      const mimeType = file.mimetype || file.type || 'application/octet-stream'
      
      let thumbnailKey = null
      let thumbnailUrl = null
      let metadata = {}
      
      if (mimeType.startsWith('image/')) {
        try {
          const imageBuffer = await fsp.readFile(filePath)
          
          const imageMeta = await imageProcessing.getImageMetadata(imageBuffer)
          if (imageMeta) {
            metadata.width = imageMeta.width
            metadata.height = imageMeta.height
          }
          
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
      
      if (mimeType.startsWith('video/')) {
        try {
          const videoMeta = await getVideoMetadata(filePath)
          if (videoMeta) {
            metadata.width = videoMeta.width
            metadata.height = videoMeta.height
            metadata.duration = videoMeta.duration
          }
        } catch (videoError) {
          console.warn('获取视频元数据失败:', videoError.message)
        }
      }

      let actualParentId = folderId || null
      const createdFolders = []

      if (relativePath && relativePath.includes('/')) {
        const pathParts = relativePath.split('/').filter(p => p && p !== originalName)
        
        for (const folderName of pathParts) {
          let existingFolder = await FileItem.findOne({
            name: folderName,
            parentId: actualParentId,
            owner: userId,
            type: 'folder',
            isDeleted: false
          })

          if (!existingFolder) {
            const newFolder = await FileItem.create({
              name: folderName,
              type: 'folder',
              parentId: actualParentId,
              path: '/',
              owner: userId
            })
            existingFolder = newFolder
            createdFolders.push(formatItem(existingFolder))
          }

          actualParentId = existingFolder._id.toString()
        }
      }

      const fileItem = await FileItem.create({
        name: originalName,
        type: 'file',
        size: stats.size,
        mimeType,
        extension: ext.replace('.', '').toLowerCase(),
        parentId: actualParentId,
        path: '/',
        storageKey,
        thumbnailKey,
        thumbnailUrl,
        metadata,
        owner: userId
      })

      this.ok(ctx, {
        file: formatItem(fileItem),
        folders: createdFolders
      }, '文件上传成功')
    } catch (error) {
      console.error('上传文件错误:', error)
      this.fail(ctx, error)
    }
  }

  async download(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const item = await FileItem.findOne({
        _id: id,
        owner: userId,
        isDeleted: false
      })

      if (!item || item.type !== 'file') {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const filePath = path.join(baseUploadDir, 'files', item.storageKey)

      try {
        await fsp.access(filePath)
      } catch {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`)
      ctx.set('Content-Type', item.mimeType || 'application/octet-stream')
      ctx.set('Content-Length', item.size.toString())

      const fileStream = fs.createReadStream(filePath)
      ctx.body = fileStream
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async preview(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const item = await FileItem.findOne({
        _id: id,
        isDeleted: false
      }).lean()

      if (!item || item.type !== 'file') {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      if (item.isPrivate && String(item.owner) !== String(userId)) {
        this.throwHttpError('无权访问此文件', HttpStatus.FORBIDDEN)
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const filePath = path.join(baseUploadDir, 'files', item.storageKey)

      try {
        await fsp.access(filePath)
      } catch {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      const stat = await fsp.stat(filePath)
      const mimeType = item.mimeType || 'application/octet-stream'
      const isImage = mimeType.startsWith('image/')
      const isVideo = mimeType.startsWith('video/')
      const isAudio = mimeType.startsWith('audio/')
      const isPdf = mimeType === 'application/pdf'
      const isText = mimeType.startsWith('text/') || 
        ['application/json', 'application/javascript', 'application/xml'].includes(mimeType) ||
        item.extension && ['txt', 'md', 'json', 'js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'html', 'xml', 'yaml', 'yml', 'sh', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'rb', 'php', 'sql', 'conf', 'log', 'env', 'gitignore'].includes(item.extension.toLowerCase())

      if (isImage || isVideo || isAudio || isPdf) {
        ctx.set('Content-Type', mimeType)
        ctx.set('Content-Length', stat.size)
        ctx.set('Accept-Ranges', 'bytes')
        ctx.set('Cache-Control', 'public, max-age=31536000')
        
        const range = ctx.headers.range
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-')
          const start = parseInt(parts[0], 10)
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
          const chunkSize = end - start + 1
          
          ctx.status = 206
          ctx.set('Content-Range', `bytes ${start}-${end}/${stat.size}`)
          ctx.set('Content-Length', chunkSize)
          
          const stream = fs.createReadStream(filePath, { start, end })
          ctx.body = stream
        } else {
          const stream = fs.createReadStream(filePath)
          ctx.body = stream
        }
      } else if (isText) {
        const content = await fsp.readFile(filePath, 'utf-8')
        ctx.set('Content-Type', 'text/plain; charset=utf-8')
        ctx.body = content
      } else {
        ctx.set('Content-Type', mimeType)
        ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(item.name)}"`)
        const stream = fs.createReadStream(filePath)
        ctx.body = stream
      }
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getFileInfo(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const item = await FileItem.findOne({
        _id: id,
        isDeleted: false
      }).lean()

      if (!item) {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      if (item.isPrivate && String(item.owner) !== String(userId)) {
        this.throwHttpError('无权访问此文件', HttpStatus.FORBIDDEN)
      }

      const mimeType = item.mimeType || 'application/octet-stream'
      const isImage = mimeType.startsWith('image/')
      const isVideo = mimeType.startsWith('video/')
      const isAudio = mimeType.startsWith('audio/')
      const isPdf = mimeType === 'application/pdf'
      const isText = mimeType.startsWith('text/') || 
        ['application/json', 'application/javascript', 'application/xml'].includes(mimeType) ||
        item.extension && ['txt', 'md', 'json', 'js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'html', 'xml', 'yaml', 'yml', 'sh', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'rb', 'php', 'sql', 'conf', 'log', 'env', 'gitignore'].includes(item.extension.toLowerCase())
      const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(item.extension?.toLowerCase() || '')

      this.ok(ctx, {
        ...formatItem(item),
        previewType: isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : isPdf ? 'pdf' : isText ? 'text' : isOffice ? 'office' : 'download'
      })
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getThumbnail(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const item = await FileItem.findOne({
        _id: id,
        isDeleted: false
      }).lean()

      if (!item || item.type !== 'file') {
        this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND)
      }

      if (item.isPrivate && String(item.owner) !== String(userId)) {
        this.throwHttpError('无权访问此文件', HttpStatus.FORBIDDEN)
      }

      if (!item.thumbnailKey) {
        this.throwHttpError('缩略图不存在', HttpStatus.NOT_FOUND)
      }

      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const thumbnailPath = path.join(baseUploadDir, 'thumbnails', item.thumbnailKey)

      try {
        await fsp.access(thumbnailPath)
      } catch {
        this.throwHttpError('缩略图不存在', HttpStatus.NOT_FOUND)
      }

      ctx.set('Content-Type', 'image/webp')
      ctx.set('Cache-Control', 'public, max-age=31536000')
      ctx.body = fs.createReadStream(thumbnailPath)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async copy(ctx) {
    try {
      const { ids, targetFolderId } = ctx.request.body
      const userId = ctx.state.user._id

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        this.throwHttpError('请选择要复制的文件', HttpStatus.BAD_REQUEST)
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id))

      const items = await FileItem.find({
        _id: { $in: objectIds },
        owner: userId,
        isDeleted: false
      })

      if (items.length === 0) {
        this.throwHttpError('未找到要复制的文件', HttpStatus.NOT_FOUND)
      }

      const copiedItems = []
      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

      for (const item of items) {
        const existingCopy = await FileItem.findOne({
          name: item.name,
          parentId: targetFolderId || null,
          owner: userId,
          isDeleted: false
        })

        let newName = item.name
        if (existingCopy) {
          const ext = path.extname(item.name)
          const baseName = path.parse(item.name).name
          newName = `${baseName}_copy${ext}`
        }

        let newStorageKey = item.storageKey
        if (item.type === 'file' && item.storageKey) {
          const srcPath = path.join(baseUploadDir, 'files', item.storageKey)
          const ext = path.extname(item.storageKey)
          const baseName = path.parse(item.storageKey).name
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substring(2, 8)
          newStorageKey = `${baseName}_${timestamp}_${randomStr}${ext}`
          
          const destPath = path.join(baseUploadDir, 'files', newStorageKey)
          await fsp.copyFile(srcPath, destPath).catch(() => {})
        }

        const copiedItem = await FileItem.create({
          name: newName,
          type: item.type,
          size: item.size,
          mimeType: item.mimeType,
          extension: item.extension,
          parentId: targetFolderId || null,
          path: '/',
          storageKey: newStorageKey,
          owner: userId,
          isFavorite: false
        })

        copiedItems.push(copiedItem)
      }

      this.ok(ctx, copiedItems, `已复制 ${copiedItems.length} 个项目`)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async move(ctx) {
    try {
      const { ids, targetFolderId } = ctx.request.body
      const userId = ctx.state.user._id

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        this.throwHttpError('请选择要移动的文件', HttpStatus.BAD_REQUEST)
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id))

      const items = await FileItem.find({
        _id: { $in: objectIds },
        owner: userId,
        isDeleted: false
      })

      if (items.length === 0) {
        this.throwHttpError('未找到要移动的文件', HttpStatus.NOT_FOUND)
      }

      const movedItems = []

      for (const item of items) {
        const existingItem = await FileItem.findOne({
          name: item.name,
          parentId: targetFolderId || null,
          owner: userId,
          isDeleted: false,
          _id: { $ne: item._id }
        })

        if (existingItem) {
          continue
        }

        item.parentId = targetFolderId || null
        await item.save()
        movedItems.push(item)
      }

      this.ok(ctx, movedItems, `已移动 ${movedItems.length} 个项目`)
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getStorageUsage(ctx) {
    try {
      const userId = ctx.state.user._id

      const result = await FileItem.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            type: 'file',
            isDeleted: false
          }
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' },
            fileCount: { $sum: 1 }
          }
        }
      ])

      const usedSize = result.length > 0 ? result[0].totalSize : 0
      const fileCount = result.length > 0 ? result[0].fileCount : 0
      const totalSize = 5 * 1024 * 1024 * 1024 * 1024

      this.ok(ctx, {
        usedSize,
        totalSize,
        fileCount,
        usedPercent: Math.round((usedSize / totalSize) * 100 * 100) / 100
      })
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async verifyFolderPassword(ctx) {
    try {
      const { folderId, password } = ctx.request.body
      const userId = ctx.state.user._id

      if (!folderId) {
        this.throwHttpError('文件夹ID不能为空', HttpStatus.BAD_REQUEST)
      }

      const folder = await FileItem.findById(folderId)

      if (!folder || folder.type !== 'folder') {
        this.throwHttpError('文件夹不存在', HttpStatus.NOT_FOUND)
      }

      if (!folder.password) {
        return this.ok(ctx, { verified: true })
      }

      if (!password) {
        this.throwHttpError('请输入密码', HttpStatus.BAD_REQUEST)
      }

      const bcrypt = require('bcryptjs')
      const isValid = await bcrypt.compare(password, folder.password)

      this.ok(ctx, { verified: isValid })
    } catch (error) {
      this.fail(ctx, error)
    }
  }

  async getFolderSize(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const folder = await FileItem.findOne({
        _id: id,
        owner: userId,
        type: 'folder',
        isDeleted: false
      })

      if (!folder) {
        this.throwHttpError('文件夹不存在', HttpStatus.NOT_FOUND)
      }

      const getAllDescendants = async (parentId) => {
        const children = await FileItem.find({
          parentId,
          isDeleted: false
        }).lean()

        let allItems = [...children]
        
        for (const child of children) {
          if (child.type === 'folder') {
            const descendants = await getAllDescendants(child._id)
            allItems = [...allItems, ...descendants]
          }
        }

        return allItems
      }

      const descendants = await getAllDescendants(id)

      const totalSize = descendants
        .filter(item => item.type === 'file')
        .reduce((sum, item) => sum + (item.size || 0), 0)

      const fileCount = descendants.filter(item => item.type === 'file').length
      const folderCount = descendants.filter(item => item.type === 'folder').length

      this.ok(ctx, {
        folderId: id,
        folderName: folder.name,
        totalSize,
        fileCount,
        folderCount,
        directChildren: descendants.filter(item => String(item.parentId) === String(id)).length
      })
    } catch (error) {
      this.fail(ctx, error)
    }
  }
}

module.exports = new FileController()
