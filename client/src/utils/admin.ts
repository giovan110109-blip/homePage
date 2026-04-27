const DEFAULT_ADMIN_URL = "https://admin.giovan.cn";

export function getAdminBaseUrl() {
  const rawUrl = import.meta.env.VITE_ADMIN_BASE_URL || DEFAULT_ADMIN_URL;
  return rawUrl.replace(/\/$/, "");
}

export function buildAdminSsoUrl(token?: string) {
  const adminUrl = new URL(getAdminBaseUrl());

  if (token) {
    adminUrl.searchParams.set("token", token);
  }

  return adminUrl.toString();
}
