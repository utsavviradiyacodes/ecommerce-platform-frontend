import { refreshAdminAccessToken } from "../features/auth/authApi.js";
import {
  invalidateAdminSession,
  selectAdminAccessToken,
  selectAdminSessionGeneration,
  setAdminAccessToken,
} from "../features/auth/authSlice.js";
import axiosInstance from "./axiosInstance.js";

const ADMIN_AUTH_RETRY_FLAG = "_adminAuthRetryAttempted";
const ADMIN_AUTH_SESSION_GENERATION_FIELD = "_adminAuthSessionGeneration";
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

function isRefreshOwnedByCurrentSession(
  store,
  accessToken,
  sessionGeneration
) {
  const rootState = store.getState();

  return (
    selectAdminAccessToken(rootState) === accessToken &&
    selectAdminSessionGeneration(rootState) === sessionGeneration
  );
}

async function runAdminAccessTokenRefresh(store, refreshOperation) {
  const { accessToken, sessionGeneration } = refreshOperation;

  try {
    const response = await refreshAdminAccessToken();

    if (
      !isRefreshOwnedByCurrentSession(
        store,
        accessToken,
        sessionGeneration
      )
    ) {
      throw new Error(ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE);
    }

    store.dispatch(setAdminAccessToken(response.token));

    return response.token;
  } catch (error) {
    if (
      error?.response?.status === 401 &&
      isRefreshOwnedByCurrentSession(store, accessToken, sessionGeneration)
    ) {
      store.dispatch(invalidateAdminSession());
    }

    throw error;
  } finally {
    if (adminAccessTokenRefreshOperation === refreshOperation) {
      adminAccessTokenRefreshOperation = null;
    }
  }
}

function getAdminAccessTokenRefreshPromise(
  store,
  accessToken,
  sessionGeneration
) {
  if (adminAccessTokenRefreshOperation) {
    if (
      adminAccessTokenRefreshOperation.accessToken !== accessToken ||
      adminAccessTokenRefreshOperation.sessionGeneration !== sessionGeneration
    ) {
      throw new Error(ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE);
    }

    return adminAccessTokenRefreshOperation.promise;
  }

  const refreshOperation = {
    accessToken,
    sessionGeneration,
    promise: null,
  };

  refreshOperation.promise = runAdminAccessTokenRefresh(
    store,
    refreshOperation
  );

  adminAccessTokenRefreshOperation = refreshOperation;

  return refreshOperation.promise;
}

export function setupAxiosInterceptors(store) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const rootState = store.getState();

      const adminAccessToken = selectAdminAccessToken(rootState);
      const adminSessionGeneration =
        selectAdminSessionGeneration(rootState);

      if (
        config[ADMIN_AUTH_RETRY_FLAG] === true &&
        (config[ADMIN_AUTH_SESSION_GENERATION_FIELD] !==
          adminSessionGeneration ||
          !isNonEmptyAccessToken(adminAccessToken) ||
          readBearerAccessToken(config) !== adminAccessToken)
      ) {
        throw new Error(ADMIN_SESSION_CHANGED_DURING_REFRESH_MESSAGE);
      }

      if (config[ADMIN_AUTH_RETRY_FLAG] !== true) {
        config[ADMIN_AUTH_SESSION_GENERATION_FIELD] =
          adminSessionGeneration;
      }

      if (adminAccessToken) {
        setAuthorizationHeader(config, adminAccessToken);
      }

      return config;
    },
    (error) => {
      throw error;
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const rootState = store.getState();
      const currentAccessToken = selectAdminAccessToken(rootState);
      const currentSessionGeneration =
        selectAdminSessionGeneration(rootState);
      const originalRequestAccessToken = readBearerAccessToken(originalRequest);
      const originalRequestSessionGeneration =
        originalRequest?.[ADMIN_AUTH_SESSION_GENERATION_FIELD];
      const shouldAttemptAdminAccessTokenRefresh =
        error?.response?.status === 401 &&
        originalRequest &&
        originalRequest.skipAuthRefresh !== true &&
        originalRequest[ADMIN_AUTH_RETRY_FLAG] !== true &&
        isNonEmptyAccessToken(currentAccessToken) &&
        originalRequestSessionGeneration === currentSessionGeneration;

      if (!shouldAttemptAdminAccessTokenRefresh) {
        throw error;
      }

      originalRequest[ADMIN_AUTH_RETRY_FLAG] = true;

      if (originalRequestAccessToken !== currentAccessToken) {
        setAuthorizationHeader(originalRequest, currentAccessToken);

        return axiosInstance(originalRequest);
      }

      const accessToken = await getAdminAccessTokenRefreshPromise(
        store,
        originalRequestAccessToken,
        originalRequestSessionGeneration
      );

      if (
        !isRefreshOwnedByCurrentSession(
          store,
          accessToken,
          originalRequestSessionGeneration
        )
      ) {
        throw error;
      }

      setAuthorizationHeader(originalRequest, accessToken);

      return axiosInstance(originalRequest);
    }
  );
}
