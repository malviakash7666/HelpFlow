import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// Request Interceptor
// ===============================

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// ===============================
// Response Interceptor
// ===============================

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    console.log("INTERCEPTOR ERROR:", originalRequest?.url);

    console.log("STATUS:", error.response?.status);

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // =================================
    // 1. Refresh token request failed
    // =================================

    if (originalRequest.url?.includes("/api/company/refresh-token")) {
      setAccessToken(null);

      window.dispatchEvent(new Event("auth-logout"));

      return Promise.reject(error);
    }

    // =================================
    // 2. Login failed
    // Don't call refresh token
    // =================================

    if (originalRequest.url?.includes("/api/company/login")) {
      console.log("Login failed, skipping refresh token");

      return Promise.reject(error);
    }

    // =================================
    // 3. Refresh only on 401
    // =================================

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await axios.post(
          `${API_URL}/api/company/refresh-token`,

          {},

          {
            withCredentials: true,
          },
        );

        if (refreshRes.data?.success && refreshRes.data?.data) {
          const { accessToken } = refreshRes.data.data;

          setAccessToken(accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        setAccessToken(null);

        window.dispatchEvent(new Event("auth-logout"));

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);
