const BaseService = require('../utils/baseService');
const AccessLogModel = require('../models/accessLog');

class AccessLogService extends BaseService {
  constructor() {
    super(AccessLogModel);
  }
}

module.exports = new AccessLogService();
