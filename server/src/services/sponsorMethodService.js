const BaseService = require('../utils/baseService');
const SponsorMethodModel = require('../models/sponsorMethod');

class SponsorMethodService extends BaseService {
  constructor() {
    super(SponsorMethodModel);
  }
}

module.exports = new SponsorMethodService();
