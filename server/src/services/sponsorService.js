const BaseService = require('../utils/baseService');
const SponsorModel = require('../models/sponsor');

class SponsorService extends BaseService {
  constructor() {
    super(SponsorModel);
  }
}

module.exports = new SponsorService();
