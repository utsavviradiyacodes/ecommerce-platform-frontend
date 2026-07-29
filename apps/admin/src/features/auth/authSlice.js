import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  signInAdmin,
  requestAdminPasswordReset,
  refreshAdminAccessToken,
  getCurrentAdmin,
  signOutAdmin,
} from "./authApi.js";

import {
  REQUEST_STATUS,
  createRequestState,
  setRequestPending,
  setRequestSucceeded,
  setRequestFailed,
  resetRequestState,
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
    signIn: createRequestState(),
    signOut: createRequestState(),
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

export const signInAdminThunk = createAsyncThunk(
  "auth/signInAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await signInAdmin(credentials);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to sign in. Please try again.")
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

export const signOutAdminThunk = createAsyncThunk(
  "auth/signOutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await signOutAdmin();

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to sign out. Please try again.")
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setAdminPasswordRecoveryEmail(state, action) {
      state.passwordRecovery.email = action.payload;
      state.passwordRecovery.userId = null;
    },

    clearAdminSignInRequestFeedback(state) {
      resetRequestState(state.requests.signIn);
    },

    clearAdminPasswordResetOtpRequestFeedback(state) {
      resetRequestState(state.requests.requestPasswordReset);
    },
  },

  selectors: {
    // -------------------- Current authentication data --------------------

    selectCurrentAdmin: (sliceState) => sliceState.admin,

    selectAdminAccessToken: (sliceState) => sliceState.accessToken,

    selectIsAdminAuthenticated: (sliceState) =>
      Boolean(sliceState.admin && sliceState.accessToken),

    // -------------------- Session initialization request --------------------

    selectIsAdminSessionInitializationPending: (sliceState) =>
      sliceState.requests.initializeSession.status === REQUEST_STATUS.PENDING,

    // -------------------- Sign In request --------------------

    selectIsAdminSignInPending: (sliceState) =>
      sliceState.requests.signIn.status === REQUEST_STATUS.PENDING,

    selectAdminSignInError: (sliceState) => sliceState.requests.signIn.error,

    // -------------------- Sign Out request --------------------

    selectIsAdminSignOutPending: (sliceState) =>
      sliceState.requests.signOut.status === REQUEST_STATUS.PENDING,

    // -------------------- Password-recovery workflow data --------------------

    selectAdminPasswordRecovery: (sliceState) => sliceState.passwordRecovery,

    // -------------------- Password-reset OTP request --------------------

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

      // ----------------------------signInAdminThunk------------------------------

      .addCase(signInAdminThunk.pending, (state) => {
        setRequestPending(state.requests.signIn);
      })
      .addCase(signInAdminThunk.fulfilled, (state, action) => {
        const { token, ...admin } = action.payload.data;

        state.accessToken = token;
        state.admin = admin;

        state.passwordRecovery.email = "";
        state.passwordRecovery.userId = null;

        setRequestSucceeded(
          state.requests.signIn,
          action.payload?.message || null
        );
      })
      .addCase(signInAdminThunk.rejected, (state, action) => {
        setRequestFailed(
          state.requests.signIn,
          getRejectedActionErrorMessage(
            action,
            "Unable to sign in. Please try again."
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

      // ----------------------------signOutAdminThunk----------------------

      .addCase(signOutAdminThunk.pending, (state) => {
        setRequestPending(state.requests.signOut);
      })
      .addCase(signOutAdminThunk.fulfilled, (state, action) => {
        state.admin = null;
        state.accessToken = null;

        setRequestSucceeded(
          state.requests.signOut,
          action.payload?.message || null
        );
      })
      .addCase(signOutAdminThunk.rejected, (state, action) => {
        setRequestFailed(
          state.requests.signOut,
          getRejectedActionErrorMessage(
            action,
            "Unable to sign out. Please try again."
          )
        );
      });
  },
});

export const {
  // Current authentication data
  selectCurrentAdmin,
  selectAdminAccessToken,
  selectIsAdminAuthenticated,

  // Session initialization request
  selectIsAdminSessionInitializationPending,

  // Sign In request
  selectIsAdminSignInPending,
  selectAdminSignInError,

  // Sign Out request
  selectIsAdminSignOutPending,

  // Password-recovery workflow data
  selectAdminPasswordRecovery,

  // Password-reset OTP request
  selectAdminPasswordResetOtpRequest,
  selectIsAdminPasswordResetOtpRequestPending,
  selectAdminPasswordResetOtpRequestError,
  selectAdminPasswordResetOtpRequestSuccessMessage,
} = authSlice.selectors;

export const {
  setAdminPasswordRecoveryEmail,
  clearAdminSignInRequestFeedback,
  clearAdminPasswordResetOtpRequestFeedback,
} = authSlice.actions;

export default authSlice.reducer;
