const crypto = require('crypto');
const axios = require('axios');
const appLogger = require('./logger');

class NpsClient {
  constructor() {
    this.baseUrl = process.env.NPS_API_URL || 'http://118.24.62.237:8081';
    this.authKey = process.env.NPS_AUTH_KEY || '';
    this.timeout = 10000;
    this._configured = false;
    this._validateConfig();
  }

  _validateConfig() {
    if (!this.authKey) {
      appLogger.warn('NPS_AUTH_KEY 环境变量未设置，NPS API 功能将不可用');
      this._configured = false;
      return;
    }
    if (!this.baseUrl) {
      appLogger.warn('NPS_API_URL 环境变量未设置，NPS API 功能将不可用');
      this._configured = false;
      return;
    }
    this._configured = true;
    appLogger.info('NPS Client 配置完成，baseUrl:', this.baseUrl);
  }

  isConfigured() {
    return this._configured;
  }

  generateAuthKey() {
    const timestamp = Math.floor(Date.now() / 1000);
    const rawKey = this.authKey + timestamp.toString();
    const hash = crypto.createHash('md5').update(rawKey).digest('hex');
    return { auth_key: hash, timestamp: timestamp };
  }

  async request(method, path, data = {}) {
    if (!this._configured) {
      throw new Error('NPS Client 未正确配置，请检查 NPS_AUTH_KEY 环境变量');
    }

    const authParams = this.generateAuthKey();
    const url = `${this.baseUrl}${path}`;
    
    const params = {
      ...authParams,
      ...data
    };

    try {
      const config = {
        method,
        url,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      if (method.toLowerCase() === 'get') {
        config.params = params;
      } else {
        config.data = new URLSearchParams(params).toString();
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      appLogger.error('NPS API 请求失败:', error.message);
      throw error;
    }
  }

  async get(path, params = {}) {
    return this.request('get', path, params);
  }

  async post(path, data = {}) {
    return this.request('post', path, data);
  }
}

module.exports = new NpsClient();
