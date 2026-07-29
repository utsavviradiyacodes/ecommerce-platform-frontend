import { selectAdminAccessToken } from "../features/auth/authSlice";
import axiosInstance from "./axiosInstance.js";

export function setupAxiosInterceptors(store) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const rootState = store.getState();

      const adminAccessToken = selectAdminAccessToken(rootState);

      if (adminAccessToken) {
        config.headers.Authorization = `Bearer ${adminAccessToken}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}
