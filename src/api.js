import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, ""),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("3s_token") || sessionStorage.getItem("3s_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAnonymousAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
    if (error.response?.status === 401 && !isAnonymousAuthRequest) {
      clearApiSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export function getApiToken() {
  return localStorage.getItem("3s_token") || sessionStorage.getItem("3s_token");
}

export function clearApiSession() {
  localStorage.removeItem("3s_token");
  localStorage.removeItem("3s_user");
  sessionStorage.removeItem("3s_token");
  sessionStorage.removeItem("3s_user");
}

export function getTokenRoles(token = getApiToken()) {
  if (!token) return [];
  try {
    const payloadPart = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(Array.from(atob(payloadPart), (char) =>
      `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
    ).join("")));
    const roles = payload.role || payload.roles || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [];
    return (Array.isArray(roles) ? roles : [roles]).map((role) => String(role).toLowerCase());
  } catch {
    return [];
  }
}

export default api;
