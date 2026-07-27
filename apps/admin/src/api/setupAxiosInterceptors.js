import { selectAccessToken } from "../features/auth/authSlice";
import axiosInstance from "./axiosInstance.js";

export function setupAxiosInterceptors(store) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const rootState = store.getState();

      const accessToken = selectAccessToken(rootState);

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}
