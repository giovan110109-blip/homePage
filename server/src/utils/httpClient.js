const axios = require('axios');

// 统一的外部接口请求客户端
class HttpClient {
    constructor() {
        this.instance = axios.create({
            baseURL: process.env.EXTERNAL_API_BASE || '',
            timeout: Number(process.env.EXTERNAL_API_TIMEOUT || 8000),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // 请求拦截：可注入全局 token、trace-id 等
        this.instance.interceptors.request.use((config) => {
            if (process.env.EXTERNAL_API_TOKEN && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
            }
            return config;
        });

        // 响应拦截：统一错误格式
        this.instance.interceptors.response.use(
            (res) => res,
            (error) => {
                if (error.response) {
                    const { status, data } = error.response;
                    return Promise.reject({
                        status,
                        message: data?.message || data?.error || error.message,
                        data
                    });
                }
                if (error.request) {
                    return Promise.reject({
                        status: null,
                        message: 'No response from server',
                        data: null
                    });
                }
                return Promise.reject({
                    status: null,
                    message: error.message,
                    data: null
                });
            }
        );
    }

    async request(config) {
        const res = await this.instance.request(config);
        return res.data;
    }

    async get(url, config = {}) {
        const res = await this.instance.get(url, config);
        return res.data;
    }

    async post(url, data = {}, config = {}) {
        const res = await this.instance.post(url, data, config);
        return res.data;
    }

    async put(url, data = {}, config = {}) {
        const res = await this.instance.put(url, data, config);
        return res.data;
    }

    async patch(url, data = {}, config = {}) {
        const res = await this.instance.patch(url, data, config);
        return res.data;
    }

    async delete(url, config = {}) {
        const res = await this.instance.delete(url, config);
        return res.data;
    }
}

module.exports = new HttpClient();
