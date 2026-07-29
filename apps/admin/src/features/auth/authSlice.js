import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginAdmin,
  requestAdminPasswordReset,
  refreshAdminAccessToken,
  getCurrentAdmin,
  logoutAdmin,
} from "./authApi";

import {
  REQUEST_STATUS,
  createRequestState,
  setRequestPending,
  setRequestSucceeded,
  setRequestFailed,
  getRejectedActionErrorMessage,
} from "../../utils/redux/requestState.js";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";

const initialState = {
  admin: null,
  accessToken: null,

  passwordRecovery: {
    email: "",
    userId: null,
  },

  requests: {
    initializeSession: createRequestState(REQUEST_STATUS.PENDING),
    login: createRequestState(),
    logout: createRequestState(),
    requestPasswordReset: createRequestState(),
  },
};

export const initializeAdminSessionThunk = createAsyncThunk(
  "auth/initializeAdminSession",
  async () => {
    const refreshResponse = await refreshAdminAccessToken();
    const accessToken = refreshResponse.token;

    const currentAdminResponse = await getCurrentAdmin(accessToken);

    return {
      accessToken,
      admin: currentAdminResponse.data,
    };
  }
);

export const loginAdminThunk = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginAdmin(credentials);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to log in. Please try again.")
      );
    }
  }
);

export const requestAdminPasswordResetThunk = createAsyncThunk(
  "auth/requestAdminPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await requestAdminPasswordReset(email);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to request a password reset. Please try again."
        )
      );
    }
  }
);

export const logoutAdminThunk = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutAdmin();

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to log out. Please try again.")
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {},

  selectors: {
    selectCurrentAdmin: (sliceState) => sliceState.admin,
    selectIsAdminAuthenticated: (sliceState) =>
      Boolean(sliceState.admin && sliceState.accessToken),
    selectAdminAccessToken: (sliceState) => sliceState.accessToken,
    selectIsAdminSessionInitializationPending: (sliceState) =>
      sliceState.requests.initializeSession.status === REQUEST_STATUS.PENDING,
    selectIsAdminLogoutPending: (sliceState) =>
      sliceState.requests.logout.status === REQUEST_STATUS.PENDING,
    selectIsAdminLoginPending: (sliceState) =>
      sliceState.requests.login.status === REQUEST_STATUS.PENDING,
    selectAdminLoginError: (sliceState) => sliceState.requests.login.error,
    selectAdminPasswordRecovery: (sliceState) => sliceState.passwordRecovery,
    selectAdminPasswordResetOtpRequest: (sliceState) =>
      sliceState.requests.requestPasswordReset,
    selectIsAdminPasswordResetOtpRequestPending: (sliceState) =>
      sliceState.requests.requestPasswordReset.status ===
      REQUEST_STATUS.PENDING,
    selectAdminPasswordResetOtpRequestError: (sliceState) =>
      sliceState.requests.requestPasswordReset.error,
    selectAdminPasswordResetOtpRequestSuccessMessage: (sliceState) =>
      sliceState.requests.requestPasswordReset.successMessage,
  },

  extraReducers: (builder) => {
    builder

      // ----------------------------initializeAdminSessionThunk--------------------

      .addCase(initializeAdminSessionThunk.pending, (state) => {
        setRequestPending(state.requests.initializeSession);
      })
      .addCase(initializeAdminSessionThunk.fulfilled, (state, action) => {
        state.admin = action.payload.admin;
        state.accessToken = action.payload.accessToken;

        setRequestSucceeded(state.requests.initializeSession);
      })
      .addCase(initializeAdminSessionThunk.rejected, (state, action) => {
        state.admin = null;
        state.accessToken = null;

        setRequestFailed(
          state.requests.initializeSession,
          getRejectedActionErrorMessage(
            action,
            "Unable to initialize the admin session."
          )
        );
      })

      // ----------------------------loginAdminThunk------------------------------
      .addCase(loginAdminThunk.pending, (state) => {
        setRequestPending(state.requests.login);
      })
      .addCase(loginAdminThunk.fulfilled, (state, action) => {
        const { token, ...admin } = action.payload.data;

        state.accessToken = token;
        state.admin = admin;

        setRequestSucceeded(
          state.requests.login,
          action.payload?.message || null
        );
      })
      .addCase(loginAdminThunk.rejected, (state, action) => {
        setRequestFailed(
          state.requests.login,
          getRejectedActionErrorMessage(
            action,
            "Unable to log in. Please try again."
          )
        );
      })

      // ----------------------------requestAdminPasswordResetThunk--------------------

      .addCase(requestAdminPasswordResetThunk.pending, (state, action) => {
        setRequestPending(state.requests.requestPasswordReset);

        state.passwordRecovery.email = action.meta.arg;
        state.passwordRecovery.userId = null;
      })
      .addCase(requestAdminPasswordResetThunk.fulfilled, (state, action) => {
        state.passwordRecovery.email = action.meta.arg;
        state.passwordRecovery.userId = action.payload.userId;

        setRequestSucceeded(
          state.requests.requestPasswordReset,
          action.payload?.message || null
        );
      })
      .addCase(requestAdminPasswordResetThunk.rejected, (state, action) => {
        state.passwordRecovery.userId = null;

        setRequestFailed(
          state.requests.requestPasswordReset,
          getRejectedActionErrorMessage(
            action,
            "Unable to request a password reset. Please try again."
          )
        );
      })

      // ----------------------------logoutAdminThunk----------------------

      .addCase(logoutAdminThunk.pending, (state) => {
        setRequestPending(state.requests.logout);
      })
      .addCase(logoutAdminThunk.fulfilled, (state, action) => {
        state.admin = null;
        state.accessToken = null;

        setRequestSucceeded(
          state.requests.logout,
          action.payload?.message || null
        );
      })
      .addCase(logoutAdminThunk.rejected, (state, action) => {
        setRequestFailed(
          state.requests.logout,
          getRejectedActionErrorMessage(
            action,
            "Unable to log out. Please try again."
          )
        );
      });
  },
});

export const {
  selectCurrentAdmin,
  selectIsAdminAuthenticated,
  selectAdminAccessToken,
  selectIsAdminSessionInitializationPending,
  selectIsAdminLogoutPending,
  selectIsAdminLoginPending,
  selectAdminLoginError,
  selectAdminPasswordRecovery,
  selectAdminPasswordResetOtpRequest,
  selectIsAdminPasswordResetOtpRequestPending,
  selectAdminPasswordResetOtpRequestError,
  selectAdminPasswordResetOtpRequestSuccessMessage,
} = authSlice.selectors;

export default authSlice.reducer;
