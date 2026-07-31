import { refreshAdminAccessToken } from "../features/auth/authApi.js";
import {
  invalidateAdminSession,
  selectAdminAccessToken,
  setAdminAccessToken,
} from "../features/auth/authSlice.js";
import axiosInstance from "./axiosInstance.js";

const ADMIN_AUTH_RETRY_FLAG = "_adminAuthRetryAttempted";
const ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE =
  "The admin session changed while refreshing.";

let adminAccessTokenRefreshOperation = null;

function readAuthorizationHeader(headers) {
  if (!headers) {
    return null;
  }

  if (typeof headers.get === "function") {
    const value = headers.get("Authorization");

    return typeof value === "string" ? value : null;
  }

  const authorizationEntry = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "authorization"
  );
  const value = authorizationEntry?.[1];

  return typeof value === "string" ? value : null;
}

function readBearerAccessToken(config) {
  const authorizationHeader = readAuthorizationHeader(config?.headers);

  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(\S+)\s*$/i);

  return match?.[1] || null;
}

function isNonEmptyAccessToken(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function setAuthorizationHeader(config, accessToken) {
  if (typeof config.headers?.set === "function") {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
    return;
  }

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${accessToken}`,
  };
}

function isRefreshOwnedByCurrentSession(store, accessToken) {
  return selectAdminAccessToken(store.getState()) === accessToken;
}

function getAdminAccessTokenRefreshPromise(store, accessToken) {
  if (adminAccessTokenRefreshOperation) {
    if (adminAccessTokenRefreshOperation.accessToken !== accessToken) {
      return Promise.reject(
        new Error(ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE)
      );
    }

    return adminAccessTokenRefreshOperation.promise;
  }

  const refreshOperation = {
    accessToken,
    promise: null,
  };

  refreshOperation.promise = refreshAdminAccessToken()
    .then((response) => {
      if (!isRefreshOwnedByCurrentSession(store, accessToken)) {
        throw new Error(ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE);
      }

      store.dispatch(setAdminAccessToken(response.token));

      return response.token;
    })
    .catch((error) => {
      if (
        error?.response?.status === 401 &&
        isRefreshOwnedByCurrentSession(store, accessToken)
      ) {
        store.dispatch(invalidateAdminSession());
      }

      throw error;
    })
    .finally(() => {
      if (adminAccessTokenRefreshOperation === refreshOperation) {
        adminAccessTokenRefreshOperation = null;
      }
    });

  adminAccessTokenRefreshOperation = refreshOperation;

  return refreshOperation.promise;
}

export function setupAxiosInterceptors(store) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const rootState = store.getState();

      const adminAccessToken = selectAdminAccessToken(rootState);

      if (
        config[ADMIN_AUTH_RETRY_FLAG] === true &&
        (!isNonEmptyAccessToken(adminAccessToken) ||
          readBearerAccessToken(config) !== adminAccessToken)
      ) {
        return Promise.reject(
          new Error(ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE)
        );
      }

      if (adminAccessToken) {
        setAuthorizationHeader(config, adminAccessToken);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const currentAccessToken = selectAdminAccessToken(store.getState());
      const originalRequestAccessToken = readBearerAccessToken(originalRequest);
      const shouldAttemptAdminAccessTokenRefresh =
        error?.response?.status === 401 &&
        originalRequest &&
        originalRequest.skipAuthRefresh !== true &&
        originalRequest[ADMIN_AUTH_RETRY_FLAG] !== true &&
        isNonEmptyAccessToken(currentAccessToken) &&
        originalRequestAccessToken === currentAccessToken;

      if (!shouldAttemptAdminAccessTokenRefresh) {
        return Promise.reject(error);
      }

      originalRequest[ADMIN_AUTH_RETRY_FLAG] = true;

      try {
        const accessToken = await getAdminAccessTokenRefreshPromise(
          store,
          originalRequestAccessToken
        );

        if (!isRefreshOwnedByCurrentSession(store, accessToken)) {
          return Promise.reject(error);
        }

        setAuthorizationHeader(originalRequest, accessToken);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
  );
}
