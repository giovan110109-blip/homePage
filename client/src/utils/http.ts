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
import { useAuthStore } from "@/stores/auth";
import router from "@/router";

const { VITE_API_BASE_URL, VITE_API_BASE_URL_LOCAL } = import.meta.env;
const RAW_BASE_URL = import.meta.env.DEV
  ? VITE_API_BASE_URL_LOCAL || VITE_API_BASE_URL
  : VITE_API_BASE_URL;

const BASE_URL = (() => {
  if (!RAW_BASE_URL) return "/api";
  const trimmed = RAW_BASE_URL.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const REFRESH_THRESHOLD = 2 * 60 * 60 * 1000;

const shouldRefreshToken = (): boolean => {
  const authStore = useAuthStore();
  if (!authStore.token) return false;
  const tokenData = localStorage.getItem("admin-auth");
  if (!tokenData) return false;
  try {
    const parsed = JSON.parse(tokenData);
    const expiresAt = parsed.expiresAt;
    if (!expiresAt) return false;
    const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    return timeUntilExpiry < REFRESH_THRESHOLD && timeUntilExpiry > 0;
  } catch {
    return false;
  }
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

      const url = config.url || "";
      const needsAuth = url.startsWith("/admin") || url.startsWith("/photos/upload") || url.startsWith("/photos/batch-delete");
      if (needsAuth && !url.includes("/refresh")) {
        const authStore = useAuthStore();
        if (authStore.token) {
          config.headers.Authorization = `Bearer ${authStore.token}`;
        }

        if (shouldRefreshToken() && !isRefreshing) {
          isRefreshing = true;
          try {
            const response = await axios.post(
              `${BASE_URL}/admin/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${authStore.token}`,
                },
              }
            );
            const { token, expiresAt } = response.data?.data || response.data;
            if (token) {
              authStore.token = token;
              localStorage.setItem(
                "admin-auth",
                JSON.stringify({
                  token,
                  expiresAt,
                  user: authStore.user,
                })
              );
              onTokenRefreshed(token);
            }
          } catch (error) {
            console.error("Token refresh failed:", error);
          } finally {
            isRefreshing = false;
          }
        }
      }
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
      const url = error?.config?.url || "";

      if (status === 401) {
        const needsAuth = url.startsWith("/admin") || url.startsWith("/photos/upload") || url.startsWith("/photos/batch-delete");
        if (needsAuth && url !== "/admin/login") {
          error.message = "登录已过期，请重新登录";
          const authStore = useAuthStore();
          authStore.logout();
          router.replace({
            name: "admin-login",
            query: { redirect: "/admin" },
          });
        } else {
          error.message = "未授权，请先登录";
        }
      } else if (status === 403) {
        error.message = "无权访问";
      } else if (status === 404) {
        error.message = "请求的资源不存在";
      } else if (status === 500) {
        error.message = "服务器错误，请稍后重试";
      } else if (!status) {
        error.message = "网络连接失败，请检查网络";
      }

      return Promise.reject(error.response?.data || error);
    }
  );

  return service;
}
