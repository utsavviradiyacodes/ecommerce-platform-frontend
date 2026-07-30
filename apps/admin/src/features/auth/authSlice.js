import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getCurrentAdmin,
  refreshAdminAccessToken,
  requestAdminPasswordReset,
  signInAdmin,
  signOutAdmin,
  verifyAdminPasswordResetOtp,
} from "./authApi.js";

import {
  REQUEST_STATUS,
  createRequestState,
  getRejectedActionErrorMessage,
  resetRequestState,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";

import { PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS } from "./authConstants.js";

const initialState = {
  admin: null,
  accessToken: null,

  passwordRecovery: {
    email: "",
    userId: null,
    resendAvailableAt: null,
  },

  requests: {
    initializeSession: createRequestState(REQUEST_STATUS.PENDING),
    signIn: createRequestState(),
    signOut: createRequestState(),
    requestPasswordReset: createRequestState(),
    resendPasswordResetOtp: createRequestState(),
    verifyPasswordResetOtp: createRequestState(),
  },
};

// -----------------------------------------------------------------------------
// Initialize the current admin session
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Sign in
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Request a password-reset OTP
// -----------------------------------------------------------------------------

export const requestAdminPasswordResetThunk = createAsyncThunk(
  "auth/requestAdminPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await requestAdminPasswordReset(email);

      return {
        ...response,

        resendAvailableAt: Date.now() + PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS,
      };
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

export const resendAdminPasswordResetOtpThunk = createAsyncThunk(
  "auth/resendAdminPasswordResetOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await requestAdminPasswordReset(email);

      return {
        ...response,

        resendAvailableAt: Date.now() + PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to resend the verification code. Please try again."
        )
      );
    }
  }
);

// -----------------------------------------------------------------------------
// Verify the password-reset OTP
// -----------------------------------------------------------------------------

export const verifyAdminPasswordResetOtpThunk = createAsyncThunk(
  "auth/verifyAdminPasswordResetOtp",
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await verifyAdminPasswordResetOtp(verificationData);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to verify the reset code. Please try again."
        )
      );
    }
  }
);

// -----------------------------------------------------------------------------
// Sign out
// -----------------------------------------------------------------------------

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
    restoreAdminPasswordRecoverySession(state, action) {
      state.passwordRecovery.email = action.payload.email;
      state.passwordRecovery.userId = action.payload.userId;
      state.passwordRecovery.resendAvailableAt =
        action.payload.resendAvailableAt;
    },

    setAdminPasswordRecoveryEmail(state, action) {
      state.passwordRecovery.email = action.payload;
      state.passwordRecovery.userId = null;
      state.passwordRecovery.resendAvailableAt = null;
    },

    clearAdminSignInRequestFeedback(state) {
      resetRequestState(state.requests.signIn);
    },

    clearAdminPasswordResetOtpRequestFeedback(state) {
      resetRequestState(state.requests.requestPasswordReset);
    },

    clearAdminPasswordResetOtpResendFeedback(state) {
      resetRequestState(state.requests.resendPasswordResetOtp);
    },

    clearAdminPasswordResetOtpVerificationFeedback(state) {
      resetRequestState(state.requests.verifyPasswordResetOtp);
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

    // -------------------- Password-reset OTP resend --------------------

    selectAdminPasswordResetOtpResendRequest: (sliceState) =>
      sliceState.requests.resendPasswordResetOtp,

    selectIsAdminPasswordResetOtpResendPending: (sliceState) =>
      sliceState.requests.resendPasswordResetOtp.status ===
      REQUEST_STATUS.PENDING,

    selectAdminPasswordResetOtpResendError: (sliceState) =>
      sliceState.requests.resendPasswordResetOtp.error,

    selectAdminPasswordResetOtpResendSuccessMessage: (sliceState) =>
      sliceState.requests.resendPasswordResetOtp.successMessage,

    // -------------------- Password-reset OTP verification --------------------

    selectAdminPasswordResetOtpVerificationRequest: (sliceState) =>
      sliceState.requests.verifyPasswordResetOtp,

    selectIsAdminPasswordResetOtpVerificationPending: (sliceState) =>
      sliceState.requests.verifyPasswordResetOtp.status ===
      REQUEST_STATUS.PENDING,

    selectAdminPasswordResetOtpVerificationError: (sliceState) =>
      sliceState.requests.verifyPasswordResetOtp.error,

    selectAdminPasswordResetOtpVerificationSuccessMessage: (sliceState) =>
      sliceState.requests.verifyPasswordResetOtp.successMessage,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Initialize admin session --------------------

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

      // -------------------- Sign in --------------------

      .addCase(signInAdminThunk.pending, (state) => {
        setRequestPending(state.requests.signIn);
      })
      .addCase(signInAdminThunk.fulfilled, (state, action) => {
        const { token, ...admin } = action.payload.data;

        state.accessToken = token;
        state.admin = admin;

        // A successful sign-in ends any unfinished recovery flow.
        state.passwordRecovery.email = "";
        state.passwordRecovery.userId = null;
        state.passwordRecovery.resendAvailableAt = null;

        resetRequestState(state.requests.requestPasswordReset);
        resetRequestState(state.requests.resendPasswordResetOtp);
        resetRequestState(state.requests.verifyPasswordResetOtp);

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

      // -------------------- Request password-reset OTP --------------------

      .addCase(requestAdminPasswordResetThunk.pending, (state, action) => {
        setRequestPending(state.requests.requestPasswordReset);

        state.passwordRecovery.email = action.meta.arg;
        state.passwordRecovery.userId = null;
        state.passwordRecovery.resendAvailableAt = null;

        resetRequestState(state.requests.resendPasswordResetOtp);
        resetRequestState(state.requests.verifyPasswordResetOtp);
      })
      .addCase(requestAdminPasswordResetThunk.fulfilled, (state, action) => {
        state.passwordRecovery.email = action.meta.arg;
        state.passwordRecovery.userId = action.payload.userId;
        state.passwordRecovery.resendAvailableAt =
          action.payload.resendAvailableAt;

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

      // -------------------- Resend password-reset OTP --------------------

      .addCase(resendAdminPasswordResetOtpThunk.pending, (state) => {
        setRequestPending(state.requests.resendPasswordResetOtp);
      })
      .addCase(resendAdminPasswordResetOtpThunk.fulfilled, (state, action) => {
        state.passwordRecovery.email = action.meta.arg;

        if (action.payload?.userId) {
          state.passwordRecovery.userId = action.payload.userId;
        }

        state.passwordRecovery.resendAvailableAt =
          action.payload.resendAvailableAt;

        setRequestSucceeded(
          state.requests.resendPasswordResetOtp,
          action.payload?.message || null
        );

        resetRequestState(state.requests.verifyPasswordResetOtp);
      })
      .addCase(resendAdminPasswordResetOtpThunk.rejected, (state, action) => {
        setRequestFailed(
          state.requests.resendPasswordResetOtp,
          getRejectedActionErrorMessage(
            action,
            "Unable to resend the verification code. Please try again."
          )
        );
      })

      // -------------------- Verify password-reset OTP --------------------

      .addCase(verifyAdminPasswordResetOtpThunk.pending, (state) => {
        setRequestPending(state.requests.verifyPasswordResetOtp);
      })
      .addCase(verifyAdminPasswordResetOtpThunk.fulfilled, (state, action) => {
        // Keep the confirmed userId returned by the backend.
        if (action.payload?.userId) {
          state.passwordRecovery.userId = action.payload.userId;
        }

        setRequestSucceeded(
          state.requests.verifyPasswordResetOtp,
          action.payload?.message || null
        );
      })
      .addCase(verifyAdminPasswordResetOtpThunk.rejected, (state, action) => {
        setRequestFailed(
          state.requests.verifyPasswordResetOtp,
          getRejectedActionErrorMessage(
            action,
            "Unable to verify the reset code. Please try again."
          )
        );
      })

      // -------------------- Sign out --------------------

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

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

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

  // Password-reset OTP resend
  selectAdminPasswordResetOtpResendRequest,
  selectIsAdminPasswordResetOtpResendPending,
  selectAdminPasswordResetOtpResendError,
  selectAdminPasswordResetOtpResendSuccessMessage,

  // Password-reset OTP verification
  selectAdminPasswordResetOtpVerificationRequest,
  selectIsAdminPasswordResetOtpVerificationPending,
  selectAdminPasswordResetOtpVerificationError,
  selectAdminPasswordResetOtpVerificationSuccessMessage,
} = authSlice.selectors;

// -----------------------------------------------------------------------------
// Synchronous actions
// -----------------------------------------------------------------------------

export const {
  restoreAdminPasswordRecoverySession,
  setAdminPasswordRecoveryEmail,
  clearAdminSignInRequestFeedback,
  clearAdminPasswordResetOtpRequestFeedback,
  clearAdminPasswordResetOtpResendFeedback,
  clearAdminPasswordResetOtpVerificationFeedback,
} = authSlice.actions;

export default authSlice.reducer;
