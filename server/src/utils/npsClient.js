const crypto = require('crypto');
const axios = require('axios');
const appLogger = require('./logger');

class NpsClient {
  constructor() {
    this.baseUrl = process.env.NPS_API_URL || 'http://118.24.62.237:8081';
    this.authKey = process.env.NPS_AUTH_KEY || '';
    this.timeout = 10000;
  }

  generateAuthKey() {
    const timestamp = Math.floor(Date.now() / 1000);
    const rawKey = this.authKey + timestamp.toString();
    const hash = crypto.createHash('md5').update(rawKey).digest('hex');
    return { auth_key: hash, timestamp };
  }

  async request(method, path, data = {}) {
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
