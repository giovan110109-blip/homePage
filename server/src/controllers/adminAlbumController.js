const BaseController = require('../utils/baseController')
const { HttpStatus } = require('../utils/response')
const Album = require('../models/album')

class AdminAlbumController extends BaseController {
  // GET /api/admin/albums
  async list(ctx) {
    try {
      const { page = 1, pageSize = 20, keyword } = ctx.query
      const pageNum = Math.max(parseInt(page, 10) || 1, 1)
      const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100)
      const skip = (pageNum - 1) * sizeNum

      const query = {}
      if (keyword) {
        query.name = { $regex: keyword, $options: 'i' }
      }

      const [items, total] = await Promise.all([
        Album.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(sizeNum)
          .populate({ path: 'coverPhoto', select: 'thumbnailUrl originalUrl title' }),
        Album.countDocuments(query)
      ])

      this.paginated(ctx, items, { page: pageNum, pageSize: sizeNum, total }, 'Fetched albums')
    } catch (err) {
      this.fail(ctx, err)
    }
  }

  // POST /api/admin/albums
  async create(ctx) {
    try {
      const payload = ctx.request.body || {}
      if (!payload.name) {
        this.throwHttpError('name is required', HttpStatus.BAD_REQUEST)
      }

      const doc = await Album.create({
        name: payload.name,
        description: payload.description,
        coverPhoto: payload.coverPhoto || undefined,
        type: payload.type || 'normal',
        smartCriteria: payload.smartCriteria || undefined,
        visibility: payload.visibility || 'public',
        sortOrder: payload.sortOrder || 'dateTaken_desc'
      })

      this.created(ctx, doc, 'Album created')
    } catch (err) {
      this.fail(ctx, err)
    }
  }

  // PUT /api/admin/albums/:id
  async update(ctx) {
    try {
      const payload = ctx.request.body || {}
      const allowed = ['name', 'description', 'coverPhoto', 'type', 'smartCriteria', 'visibility', 'sortOrder']
      const updates = {}
      allowed.forEach((key) => {
        if (payload[key] !== undefined) updates[key] = payload[key]
      })

      const updated = await Album.findByIdAndUpdate(ctx.params.id, updates, { new: true })
      if (!updated) this.throwHttpError('Album not found', HttpStatus.NOT_FOUND)

      this.ok(ctx, updated, 'Album updated')
    } catch (err) {
      this.fail(ctx, err)
    }
  }

  // DELETE /api/admin/albums/:id
  async remove(ctx) {
    try {
      const removed = await Album.findByIdAndDelete(ctx.params.id)
      if (!removed) this.throwHttpError('Album not found', HttpStatus.NOT_FOUND)
      this.ok(ctx, removed, 'Album deleted')
    } catch (err) {
      this.fail(ctx, err)
    }
  }
}

module.exports = new AdminAlbumController()
