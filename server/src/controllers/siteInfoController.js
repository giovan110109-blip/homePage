const BaseController = require('../utils/baseController');
const SiteInfo = require('../models/siteInfo');

class SiteInfoController extends BaseController {
  // GET /api/site-info
  async getPublic(ctx) {
    try {
      const doc = await SiteInfo.findOne().lean();
      this.ok(ctx, doc || {}, 'Fetched site info');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/admin/site-info
  async getAdmin(ctx) {
    try {
      const doc = await SiteInfo.findOne().lean();
      this.ok(ctx, doc || {}, 'Fetched site info');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // PUT /api/admin/site-info
  async upsert(ctx) {
    try {
      const payload = ctx.request.body || {};
      const doc = await SiteInfo.findOneAndUpdate(
        {},
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true, lean: true }
      );
      this.ok(ctx, doc, 'Site info saved');
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new SiteInfoController();