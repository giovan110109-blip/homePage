const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const Article = require('../models/article');
const FriendLink = require('../models/friendLink');
const Message = require('../models/message');
const Moment = require('../models/moment');
const Photo = require('../models/photo');

const getFirst = (items) => (Array.isArray(items) && items.length ? items[0] : null);
const truncateText = (value = '', maxLength = 54) => {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
const splitAddress = (value = '') => normalizeText(value)
  .split(/[，,、]/)
  .map((part) => part.trim())
  .filter((part) => part && !/^\d{5,}$/.test(part));
const uniqueParts = (parts = []) => {
  const seen = new Set();
  return parts.filter((part) => {
    const normalized = normalizeText(part);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};
const isVerboseAddress = (value = '') => {
  const text = normalizeText(value);
  return text.length > 18 && splitAddress(text).length >= 4;
};

const publicPhotoMatch = {
  status: 'completed',
  visibility: 'public',
};
const validTypes = new Set(['photo', 'article', 'moment', 'travel', 'friend', 'message']);
const defaultAllowedTypes = ['photo', 'travel', 'friend', 'message'];

const getAllowedTypes = (rawTypes) => {
  if (!rawTypes) return new Set(defaultAllowedTypes);

  const types = String(rawTypes)
    .split(',')
    .map((type) => type.trim())
    .filter((type) => validTypes.has(type));

  return new Set(types);
};

class RandomPortalController extends BaseController {
  async open(ctx) {
    try {
      const allowedTypes = getAllowedTypes(ctx.query.types);
      if (!allowedTypes.size) {
        this.throwHttpError('随机传送门还没有配置可进入路径', HttpStatus.BAD_REQUEST);
      }

      const [photo, article, moment, travelPhoto, friendLink, message] = await Promise.all([
        allowedTypes.has('photo') ? this.getRandomPhoto() : null,
        allowedTypes.has('article') ? this.getRandomArticle() : null,
        allowedTypes.has('moment') ? this.getRandomMoment() : null,
        allowedTypes.has('travel') ? this.getRandomTravelPhoto() : null,
        allowedTypes.has('friend') ? this.getRandomFriendLink() : null,
        allowedTypes.has('message') ? this.getRandomMessage() : null,
      ]);

      const destinations = [
        photo && {
          type: 'photo',
          label: '一张照片',
          title: this.getPhotoTitle(photo),
          description: this.getPhotoDescription(photo),
          path: `/gallery?photoId=${photo._id}`,
          memory: this.getPhotoMemory(photo),
        },
        article && {
          type: 'article',
          label: '一篇文章',
          title: article.title,
          description: truncateText(article.summary || article.category || '去读一段旧想法'),
          path: `/articles/${article._id}`,
          memory: {
            year: article.createdAt ? new Date(article.createdAt).getFullYear() : '',
            excerpt: truncateText(article.summary || article.category || '', 82),
          },
        },
        moment && {
          type: 'moment',
          label: '一条说说',
          title: truncateText(moment.content, 24) || '一条生活碎片',
          description: this.getMomentDescription(moment),
          path: `/moments?moment=${moment._id}`,
          memory: {
            year: moment.createdAt ? new Date(moment.createdAt).getFullYear() : '',
            place: moment.location?.name || '',
            excerpt: truncateText(moment.content, 92),
          },
        },
        travelPhoto && {
          type: 'travel',
          label: '一个旅行地点',
          title: this.getTravelTitle(travelPhoto),
          description: this.getPhotoDescription(travelPhoto),
          path: `/travel?lat=${travelPhoto.location.latitude}&lng=${travelPhoto.location.longitude}`,
          memory: this.getPhotoMemory(travelPhoto),
        },
        friendLink && {
          type: 'friend',
          label: '一个朋友站点',
          title: friendLink.name,
          description: truncateText(friendLink.description || '拜访一颗朋友星球'),
          externalUrl: friendLink.url,
          friendLinkId: friendLink._id,
          memory: {
            excerpt: truncateText(friendLink.description || '', 92),
          },
        },
        message && {
          type: 'message',
          label: '一条留言',
          title: `${message.name || '访客'} 的留言`,
          description: this.getMessageDescription(message),
          path: `/note?message=${message._id}`,
          memory: {
            year: message.createdAt ? new Date(message.createdAt).getFullYear() : '',
            place: this.getMessagePlace(message),
            messageAuthor: message.name || '访客',
            messageContent: truncateText(message.content, 96),
            avatar: message.avatar || '',
          },
        },
      ].filter(Boolean);

      if (!destinations.length) {
        this.throwHttpError('暂时还没有可传送的内容', HttpStatus.NOT_FOUND);
      }

      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      this.ok(ctx, destination, '传送门已打开');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async getRandomPhoto() {
    return getFirst(await Photo.aggregate([
      { $match: publicPhotoMatch },
      { $sample: { size: 1 } },
      {
        $project: {
          title: 1,
          dateTaken: 1,
          geoinfo: 1,
          originalUrl: 1,
          thumbnailUrl: 1,
          originalFileUrl: 1,
          camera: 1,
        },
      },
    ]));
  }

  async getRandomArticle() {
    return getFirst(await Article.aggregate([
      { $match: { status: 'published' } },
      { $sample: { size: 1 } },
      {
        $project: {
          title: 1,
          summary: 1,
          category: 1,
          createdAt: 1,
        },
      },
    ]));
  }

  async getRandomMoment() {
    return getFirst(await Moment.aggregate([
      { $match: { status: 'published', visibility: 'public' } },
      { $sample: { size: 1 } },
      {
        $project: {
          content: 1,
          type: 1,
          location: 1,
          createdAt: 1,
        },
      },
    ]));
  }

  async getRandomTravelPhoto() {
    return getFirst(await Photo.aggregate([
      {
        $match: {
          ...publicPhotoMatch,
          'location.latitude': { $exists: true, $ne: null },
          'location.longitude': { $exists: true, $ne: null },
        },
      },
      { $sample: { size: 1 } },
      {
        $project: {
          title: 1,
          dateTaken: 1,
          geoinfo: 1,
          location: 1,
          originalUrl: 1,
          thumbnailUrl: 1,
          originalFileUrl: 1,
          camera: 1,
        },
      },
    ]));
  }

  async getRandomFriendLink() {
    return getFirst(await FriendLink.aggregate([
      { $match: { status: 'approved', isActive: true } },
      { $sample: { size: 1 } },
      {
        $project: {
          name: 1,
          url: 1,
          description: 1,
        },
      },
    ]));
  }

  async getRandomMessage() {
    return getFirst(await Message.aggregate([
      { $match: { status: 'approved', isPrivate: { $ne: true } } },
      { $sample: { size: 1 } },
      {
        $project: {
          name: 1,
          content: 1,
          avatar: 1,
          createdAt: 1,
          location: 1,
        },
      },
    ]));
  }

  getPhotoDescription(photo) {
    const date = photo.dateTaken ? new Date(photo.dateTaken).toISOString().slice(0, 10) : '';
    return date || '去翻一张被时间收藏的照片';
  }

  getPhotoMemory(photo) {
    return {
      imageUrl: photo.originalUrl || photo.originalFileUrl || '',
      placeholderUrl: photo.thumbnailUrl || '',
      year: photo.dateTaken ? new Date(photo.dateTaken).getFullYear() : '',
      place: this.getPhotoPlaceSummary(photo),
      camera: this.getCameraLabel(photo.camera),
    };
  }

  getCameraLabel(camera = {}) {
    return [
      camera.make,
      camera.model,
      camera.lens,
    ].filter(Boolean).join(' · ');
  }

  getMomentDescription(moment) {
    const place = moment.location?.name;
    const date = moment.createdAt ? new Date(moment.createdAt).toISOString().slice(0, 10) : '';
    return [place, date].filter(Boolean).join(' · ') || '去看看某一天的心情切片';
  }

  getMessagePlace(message) {
    return [
      message.location?.city,
      message.location?.region,
      message.location?.country,
    ].filter(Boolean).join(' · ');
  }

  getMessageDescription(message) {
    const date = message.createdAt ? new Date(message.createdAt).toISOString().slice(0, 10) : '';
    return [this.getMessagePlace(message), date].filter(Boolean).join(' · ') || '去看看一位访客留下的字句';
  }

  getTravelTitle(photo) {
    return this.getPhotoTitle(photo);
  }

  getPhotoTitle(photo) {
    const title = normalizeText(photo.title);
    if (title && !isVerboseAddress(title)) return title;

    const locationName = normalizeText(photo.geoinfo?.locationName);
    const addressParts = splitAddress(locationName).filter((part) => part !== '中国');
    return addressParts[0] || photo.geoinfo?.city || photo.geoinfo?.region || photo.geoinfo?.country || title || '未知坐标';
  }

  getPhotoPlaceSummary(photo) {
    const locationName = normalizeText(photo.geoinfo?.locationName);
    const addressParts = splitAddress(locationName);
    const broadParts = uniqueParts([
      photo.geoinfo?.city,
      photo.geoinfo?.region,
      photo.geoinfo?.country,
    ]);

    if (broadParts.length) return broadParts.join(' · ');

    return [
      ...addressParts.filter((part) => part !== '中国').slice(-3),
      addressParts.includes('中国') ? '中国' : '',
    ].filter(Boolean).join(' · ');
  }
}

module.exports = new RandomPortalController();
