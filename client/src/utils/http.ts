/**
 * HTTP Utilities
 * Contains HTTP client setup and interceptor configuration
 */

import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const { VITE_API_BASE_URL, VITE_API_BASE_URL_LOCAL } = import.meta.env;
const RAW_BASE_URL = import.meta.env.DEV
  ? VITE_API_BASE_URL_LOCAL || VITE_API_BASE_URL
  : VITE_API_BASE_URL;

const BASE_URL = (() => {
  if (!RAW_BASE_URL) return "/api";
  const trimmed = RAW_BASE_URL.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

const ERROR_MESSAGES: Record<number, string> = {
  400: "请求参数错误",
  401: "登录已过期，请重新登录",
  403: "无权访问该资源",
  404: "请求的资源不存在",
  405: "请求方法不允许",
  408: "请求超时",
  409: "资源冲突",
  422: "参数验证失败",
  429: "请求过于频繁，请稍后重试",
  500: "服务器内部错误",
  502: "网关错误",
  503: "服务暂时不可用",
  504: "网关超时",
};

const getErrorMessage = (status: number, serverMessage?: string): string => {
  if (serverMessage) return serverMessage;
  return ERROR_MESSAGES[status] || `请求失败 (${status})`;
};

export function createHttpClient(): AxiosInstance {
  const service: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    withCredentials: false,
  });

  service.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (config.url?.includes("/upload")) {
        config.timeout = 15 * 60 * 1000;
      }

      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      config.headers["x-request-timestamp"] = Date.now().toString();
      return config;
    },
    (error) => Promise.reject(error),
  );

  service.interceptors.response.use(
    (response: AxiosResponse) => {
      return response.data;
    },
    (error) => {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;

      if (status === 401) {
        error.message = getErrorMessage(401, serverMessage || "未授权，请先登录");
      } else if (status === 403) {
        error.message = getErrorMessage(403, serverMessage);
      } else if (status === 404) {
        error.message = getErrorMessage(404, serverMessage);
      } else if (status === 429) {
        error.message = getErrorMessage(429, serverMessage);
      } else if (status >= 500) {
        error.message = getErrorMessage(status, serverMessage);
      } else if (status >= 400) {
        error.message = getErrorMessage(status, serverMessage);
      } else if (!status) {
        error.message = "网络连接失败，请检查网络设置";
      }

      const errorData = error?.response?.data;
      if (errorData && typeof errorData === "object") {
        errorData.message = error.message;
        return Promise.reject(errorData);
      }

      return Promise.reject({ message: error.message, status });
    }
  );

  return service;
}
