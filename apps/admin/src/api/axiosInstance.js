import axios from "axios";

const ADMIN_API_TIMEOUT_MS = 30000;

const ADMIN_API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  withCredentials: true,
  timeout: ADMIN_API_TIMEOUT_MS,
});

export default axiosInstance;
