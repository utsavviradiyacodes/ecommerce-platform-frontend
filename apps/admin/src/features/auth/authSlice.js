import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getCurrentAdmin,
  refreshAdminAccessToken,
  requestAdminPasswordReset,
  resetAdminPassword,
  signInAdmin,
  signOutAdmin,
  verifyAdminPasswordResetOtp,
} from "./authApi.js";

import {
  REQUEST_STATUS,
  clearRequestFeedback,
  createRequestState,
  getRejectedActionErrorMessage,
  isRequestStateOwnedBy,
  resetRequestState,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";

import {
  ADMIN_PASSWORD_RECOVERY_NOTICE,
  ADMIN_PASSWORD_RECOVERY_PHASE,
  ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE,
  PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS,
  getSafeAdminPasswordRecoveryPhase,
  isAdminPasswordRecoveryStateValid,
} from "./authConstants.js";

const PASSWORD_RESET_REJECTION_REASON = {
  OTP_INVALID: "otpInvalid",
};

const INVALID_OR_EXPIRED_OTP_MESSAGES = new Set([
  "Invalid OTP code",
  "OTP has expired",
  "OTP has expired. Please request a new one.",
]);

const ADMIN_SESSION_INITIALIZATION_OUTCOME = {
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
};

const ADMIN_SESSION_INITIALIZATION_FAILURE_REASON = {
  TEMPORARILY_UNAVAILABLE: "temporarilyUnavailable",
};

const ADMIN_SESSION_INITIALIZATION_FAILURE_MESSAGE =
  "We couldn't check your admin session. Please try again.";

const initialState = {
  admin: null,
  accessToken: null,

  passwordRecovery: {
    email: "",
    userId: null,
    resendAvailableAt: null,
    verifiedOtp: null,
    phase: ADMIN_PASSWORD_RECOVERY_PHASE.IDLE,
  },

  notices: {
    passwordRecovery: null,
    passwordResetSuccess: null,
  },

  requests: {
    initializeSession: createRequestState(),
    signIn: createRequestState(),
    signOut: createRequestState(),
    requestPasswordReset: createRequestState(),
    resendPasswordResetOtp: createRequestState(),
    verifyPasswordResetOtp: createRequestState(),
    resetPassword: createRequestState(),
  },
};

function resetPasswordRecoveryRequestStates(state) {
  resetRequestState(state.requests.requestPasswordReset);
  resetRequestState(state.requests.resendPasswordResetOtp);
  resetRequestState(state.requests.verifyPasswordResetOtp);
  resetRequestState(state.requests.resetPassword);
}

function clearPasswordRecoveryData(
  state,
  phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE
) {
  state.passwordRecovery.email = "";
  state.passwordRecovery.userId = null;
  state.passwordRecovery.resendAvailableAt = null;
  state.passwordRecovery.verifiedOtp = null;
  state.passwordRecovery.phase = phase;
}

function clearAdminAuthenticationBoundaryState(state) {
  state.admin = null;
  state.accessToken = null;

  clearPasswordRecoveryData(state);
  state.notices.passwordRecovery = null;
  state.notices.passwordResetSuccess = null;

  resetRequestState(state.requests.initializeSession);
  resetRequestState(state.requests.signIn);
  resetRequestState(state.requests.signOut);
  resetPasswordRecoveryRequestStates(state);
}

function isOwnedRequest(requestState, action) {
  return isRequestStateOwnedBy(requestState, action.meta.requestId);
}

function createRequestedPasswordRecovery(email, userId, resendAvailableAt) {
  return {
    email,
    userId,
    resendAvailableAt,
    verifiedOtp: null,
    phase: ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED,
  };
}

function createVerifiedPasswordRecovery(
  passwordRecovery,
  userId,
  verifiedOtp
) {
  return {
    ...passwordRecovery,
    userId,
    verifiedOtp,
    phase: ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED,
  };
}

// -----------------------------------------------------------------------------
// Initialize the current admin session
// -----------------------------------------------------------------------------

export const initializeAdminSessionThunk = createAsyncThunk(
  "auth/initializeAdminSession",
  async (_, { rejectWithValue }) => {
    try {
      const refreshResponse = await refreshAdminAccessToken();
      const accessToken = refreshResponse.token;

      const currentAdminResponse = await getCurrentAdmin(accessToken, {
        skipAuthRefresh: true,
      });

      return {
        outcome: ADMIN_SESSION_INITIALIZATION_OUTCOME.AUTHENTICATED,
        accessToken,
        admin: currentAdminResponse.data,
      };
    } catch (error) {
      if (error?.response?.status === 401) {
        return {
          outcome: ADMIN_SESSION_INITIALIZATION_OUTCOME.UNAUTHENTICATED,
        };
      }

      return rejectWithValue({
        reason:
          ADMIN_SESSION_INITIALIZATION_FAILURE_REASON.TEMPORARILY_UNAVAILABLE,
        message: ADMIN_SESSION_INITIALIZATION_FAILURE_MESSAGE,
      });
    }
  },
  {
    condition: (_, { getState }) =>
      getState().auth.requests.initializeSession.status !==
      REQUEST_STATUS.PENDING,
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
        success: response.success,
        message: response.message,
        userId: response.userId,
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
  },
  {
    condition: (_, { getState }) =>
      getState().auth.requests.requestPasswordReset.status !==
      REQUEST_STATUS.PENDING,
  }
);

// -----------------------------------------------------------------------------
// Resend the password-reset OTP
// -----------------------------------------------------------------------------

export const resendAdminPasswordResetOtpThunk = createAsyncThunk(
  "auth/resendAdminPasswordResetOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await requestAdminPasswordReset(email);

      return {
        success: response.success,
        message: response.message,
        userId: response.userId,
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
  },
  {
    condition: (email, { getState }) => {
      const { passwordRecovery, requests } = getState().auth;

      return (
        passwordRecovery.phase ===
          ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED &&
        isAdminPasswordRecoveryStateValid(passwordRecovery) &&
        passwordRecovery.email === email &&
        requests.resendPasswordResetOtp.status !== REQUEST_STATUS.PENDING &&
        requests.verifyPasswordResetOtp.status !== REQUEST_STATUS.PENDING &&
        requests.resetPassword.status !== REQUEST_STATUS.PENDING
      );
    },
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
  },
  {
    condition: ({ userId }, { getState }) => {
      const { passwordRecovery, requests } = getState().auth;

      return (
        passwordRecovery.phase ===
          ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED &&
        isAdminPasswordRecoveryStateValid(passwordRecovery) &&
        passwordRecovery.userId === userId &&
        requests.resendPasswordResetOtp.status !== REQUEST_STATUS.PENDING &&
        requests.verifyPasswordResetOtp.status !== REQUEST_STATUS.PENDING
      );
    },
  }
);

// -----------------------------------------------------------------------------
// Reset the admin password
// -----------------------------------------------------------------------------

export const resetAdminPasswordThunk = createAsyncThunk(
  "auth/resetAdminPassword",
  async (passwordResetData, { rejectWithValue }) => {
    try {
      const response = await resetAdminPassword(passwordResetData);

      return response;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to reset the password. Please try again."
      );
      const isInvalidOrExpiredOtp =
        error?.response?.status === 400 &&
        INVALID_OR_EXPIRED_OTP_MESSAGES.has(message);

      return rejectWithValue({
        message,
        reason: isInvalidOrExpiredOtp
          ? PASSWORD_RESET_REJECTION_REASON.OTP_INVALID
          : null,
      });
    }
  },
  {
    condition: ({ userId, otp }, { getState }) => {
      const { passwordRecovery, requests } = getState().auth;

      return (
        passwordRecovery.phase ===
          ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED &&
        isAdminPasswordRecoveryStateValid(passwordRecovery) &&
        passwordRecovery.userId === userId &&
        passwordRecovery.verifiedOtp === otp &&
        requests.resetPassword.status !== REQUEST_STATUS.PENDING
      );
    },
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
    setAdminAccessToken(state, action) {
      state.accessToken = action.payload;
    },

    invalidateAdminSession(state) {
      clearAdminAuthenticationBoundaryState(state);
    },

    restoreAdminPasswordRecoverySession(state, action) {
      state.passwordRecovery.email = action.payload.email;
      state.passwordRecovery.userId = action.payload.userId;
      state.passwordRecovery.resendAvailableAt =
        action.payload.resendAvailableAt;
      state.passwordRecovery.verifiedOtp = action.payload.verifiedOtp;
      state.passwordRecovery.phase = action.payload.phase;
    },

    repairAdminPasswordRecoveryState(state) {
      const safePhase = getSafeAdminPasswordRecoveryPhase(
        state.passwordRecovery
      );

      if (safePhase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED) {
        state.passwordRecovery.verifiedOtp = null;
        state.passwordRecovery.phase =
          ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED;

        resetRequestState(state.requests.verifyPasswordResetOtp);
        resetRequestState(state.requests.resetPassword);
        return;
      }

      if (safePhase === ADMIN_PASSWORD_RECOVERY_PHASE.IDLE) {
        state.passwordRecovery.email =
          typeof state.passwordRecovery.email === "string"
            ? state.passwordRecovery.email
            : "";
        state.passwordRecovery.userId = null;
        state.passwordRecovery.resendAvailableAt = null;
        state.passwordRecovery.verifiedOtp = null;
        state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;

        resetPasswordRecoveryRequestStates(state);
      }
    },

    setAdminPasswordRecoveryEmail(state, action) {
      state.passwordRecovery.email =
        typeof action.payload === "string" ? action.payload.trim() : "";
      state.passwordRecovery.userId = null;
      state.passwordRecovery.resendAvailableAt = null;
      state.passwordRecovery.verifiedOtp = null;
      state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
      state.notices.passwordRecovery = null;

      resetPasswordRecoveryRequestStates(state);
    },

    cancelAdminPasswordRecovery(state) {
      clearPasswordRecoveryData(
        state,
        ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED
      );
      state.notices.passwordRecovery = null;

      resetPasswordRecoveryRequestStates(state);
    },

    completeAdminPasswordRecoveryNavigation(state) {
      if (
        state.passwordRecovery.phase ===
          ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED ||
        state.passwordRecovery.phase ===
          ADMIN_PASSWORD_RECOVERY_PHASE.RESET_SUCCEEDED
      ) {
        state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
        resetPasswordRecoveryRequestStates(state);
      }
    },

    consumeAdminPasswordRecoveryNotice(state) {
      state.notices.passwordRecovery = null;
    },

    consumeAdminPasswordResetSuccessMessage(state) {
      state.notices.passwordResetSuccess = null;
    },

    clearAdminSignInRequestFeedback(state) {
      clearRequestFeedback(state.requests.signIn);
    },

    clearAdminPasswordResetOtpRequestFeedback(state) {
      clearRequestFeedback(state.requests.requestPasswordReset);
    },

    clearAdminPasswordResetOtpResendFeedback(state) {
      clearRequestFeedback(state.requests.resendPasswordResetOtp);
    },

    clearAdminPasswordResetOtpVerificationFeedback(state) {
      clearRequestFeedback(state.requests.verifyPasswordResetOtp);
    },

    clearAdminPasswordResetFeedback(state) {
      clearRequestFeedback(state.requests.resetPassword);
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

    selectHasAdminSessionInitializationFailed: (sliceState) =>
      sliceState.requests.initializeSession.status === REQUEST_STATUS.FAILED,

    selectAdminSessionInitializationError: (sliceState) =>
      sliceState.requests.initializeSession.error,

    // -------------------- Sign In request --------------------

    selectIsAdminSignInPending: (sliceState) =>
      sliceState.requests.signIn.status === REQUEST_STATUS.PENDING,

    selectAdminSignInError: (sliceState) => sliceState.requests.signIn.error,

    // -------------------- Sign Out request --------------------

    selectIsAdminSignOutPending: (sliceState) =>
      sliceState.requests.signOut.status === REQUEST_STATUS.PENDING,

    // -------------------- Password-recovery workflow data --------------------

    selectAdminPasswordRecovery: (sliceState) => sliceState.passwordRecovery,

    selectAdminPasswordRecoveryNotice: (sliceState) =>
      sliceState.notices.passwordRecovery,

    selectAdminPasswordResetCompletionMessage: (sliceState) =>
      sliceState.notices.passwordResetSuccess,

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

    // -------------------- Password reset --------------------

    selectAdminPasswordResetRequest: (sliceState) =>
      sliceState.requests.resetPassword,

    selectIsAdminPasswordResetPending: (sliceState) =>
      sliceState.requests.resetPassword.status === REQUEST_STATUS.PENDING,

    selectAdminPasswordResetError: (sliceState) =>
      sliceState.requests.resetPassword.error,

    selectAdminPasswordResetSuccessMessage: (sliceState) =>
      sliceState.requests.resetPassword.successMessage,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Initialize admin session --------------------

      .addCase(initializeAdminSessionThunk.pending, (state, action) => {
        setRequestPending(
          state.requests.initializeSession,
          action.meta.requestId
        );
      })
      .addCase(initializeAdminSessionThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.initializeSession, action)) {
          return;
        }

        if (
          action.payload.outcome ===
          ADMIN_SESSION_INITIALIZATION_OUTCOME.AUTHENTICATED
        ) {
          state.admin = action.payload.admin;
          state.accessToken = action.payload.accessToken;
        } else {
          state.admin = null;
          state.accessToken = null;
        }

        setRequestSucceeded(state.requests.initializeSession);
      })
      .addCase(initializeAdminSessionThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.initializeSession, action)) {
          return;
        }

        setRequestFailed(
          state.requests.initializeSession,
          typeof action.payload?.message === "string"
            ? action.payload.message
            : ADMIN_SESSION_INITIALIZATION_FAILURE_MESSAGE
        );
      })

      // -------------------- Sign in --------------------

      .addCase(signInAdminThunk.pending, (state, action) => {
        setRequestPending(state.requests.signIn, action.meta.requestId);
      })
      .addCase(signInAdminThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.signIn, action)) {
          return;
        }

        const { token, ...admin } = action.payload.data;

        state.accessToken = token;
        state.admin = admin;

        clearPasswordRecoveryData(state);
        state.notices.passwordRecovery = null;
        state.notices.passwordResetSuccess = null;
        resetPasswordRecoveryRequestStates(state);

        setRequestSucceeded(
          state.requests.signIn,
          action.payload?.message || null
        );
      })
      .addCase(signInAdminThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.signIn, action)) {
          return;
        }

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
        setRequestPending(
          state.requests.requestPasswordReset,
          action.meta.requestId
        );

        state.passwordRecovery.email = action.meta.arg;
        state.passwordRecovery.userId = null;
        state.passwordRecovery.resendAvailableAt = null;
        state.passwordRecovery.verifiedOtp = null;
        state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
        state.notices.passwordRecovery = null;

        resetRequestState(state.requests.resendPasswordResetOtp);
        resetRequestState(state.requests.verifyPasswordResetOtp);
        resetRequestState(state.requests.resetPassword);
      })
      .addCase(requestAdminPasswordResetThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.requestPasswordReset, action)) {
          return;
        }

        const nextPasswordRecovery = createRequestedPasswordRecovery(
          action.meta.arg,
          action.payload?.userId,
          action.payload?.resendAvailableAt
        );

        if (
          action.payload?.success !== true ||
          !isAdminPasswordRecoveryStateValid(nextPasswordRecovery)
        ) {
          state.passwordRecovery.userId = null;
          state.passwordRecovery.resendAvailableAt = null;
          state.passwordRecovery.verifiedOtp = null;
          state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;

          setRequestFailed(
            state.requests.requestPasswordReset,
            ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE
          );
          return;
        }

        state.passwordRecovery = nextPasswordRecovery;

        setRequestSucceeded(
          state.requests.requestPasswordReset,
          action.payload?.message || null
        );
      })
      .addCase(requestAdminPasswordResetThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.requestPasswordReset, action)) {
          return;
        }

        state.passwordRecovery.userId = null;
        state.passwordRecovery.resendAvailableAt = null;
        state.passwordRecovery.verifiedOtp = null;
        state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;

        setRequestFailed(
          state.requests.requestPasswordReset,
          getRejectedActionErrorMessage(
            action,
            "Unable to request a password reset. Please try again."
          )
        );
      })

      // -------------------- Resend password-reset OTP --------------------

      .addCase(resendAdminPasswordResetOtpThunk.pending, (state, action) => {
        setRequestPending(
          state.requests.resendPasswordResetOtp,
          action.meta.requestId
        );
        state.notices.passwordRecovery = null;
      })
      .addCase(resendAdminPasswordResetOtpThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.resendPasswordResetOtp, action)) {
          return;
        }

        const nextPasswordRecovery = createRequestedPasswordRecovery(
          action.meta.arg,
          action.payload?.userId,
          action.payload?.resendAvailableAt
        );

        if (
          action.payload?.success !== true ||
          !isAdminPasswordRecoveryStateValid(nextPasswordRecovery)
        ) {
          setRequestFailed(
            state.requests.resendPasswordResetOtp,
            ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE
          );
          return;
        }

        state.passwordRecovery = nextPasswordRecovery;

        setRequestSucceeded(
          state.requests.resendPasswordResetOtp,
          action.payload?.message || null
        );

        resetRequestState(state.requests.verifyPasswordResetOtp);
        resetRequestState(state.requests.resetPassword);
      })
      .addCase(resendAdminPasswordResetOtpThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.resendPasswordResetOtp, action)) {
          return;
        }

        setRequestFailed(
          state.requests.resendPasswordResetOtp,
          getRejectedActionErrorMessage(
            action,
            "Unable to resend the verification code. Please try again."
          )
        );
      })

      // -------------------- Verify password-reset OTP --------------------

      .addCase(verifyAdminPasswordResetOtpThunk.pending, (state, action) => {
        setRequestPending(
          state.requests.verifyPasswordResetOtp,
          action.meta.requestId
        );
        state.notices.passwordRecovery = null;
      })
      .addCase(verifyAdminPasswordResetOtpThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.verifyPasswordResetOtp, action)) {
          return;
        }

        const nextPasswordRecovery = createVerifiedPasswordRecovery(
          state.passwordRecovery,
          action.payload?.userId,
          action.meta.arg.otp
        );

        if (
          action.payload?.success !== true ||
          action.payload?.userId !== state.passwordRecovery.userId ||
          !isAdminPasswordRecoveryStateValid(nextPasswordRecovery)
        ) {
          setRequestFailed(
            state.requests.verifyPasswordResetOtp,
            ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE
          );
          return;
        }

        state.passwordRecovery = nextPasswordRecovery;

        resetRequestState(state.requests.resetPassword);

        setRequestSucceeded(
          state.requests.verifyPasswordResetOtp,
          action.payload?.message || null
        );
      })
      .addCase(verifyAdminPasswordResetOtpThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.verifyPasswordResetOtp, action)) {
          return;
        }

        setRequestFailed(
          state.requests.verifyPasswordResetOtp,
          getRejectedActionErrorMessage(
            action,
            "Unable to verify the reset code. Please try again."
          )
        );
      })

      // -------------------- Reset password --------------------

      .addCase(resetAdminPasswordThunk.pending, (state, action) => {
        setRequestPending(state.requests.resetPassword, action.meta.requestId);
      })
      .addCase(resetAdminPasswordThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.resetPassword, action)) {
          return;
        }

        if (action.payload?.success !== true) {
          setRequestFailed(
            state.requests.resetPassword,
            ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE
          );
          return;
        }

        const successMessage =
          action.payload?.message ||
          "Password reset successfully. You can now sign in.";

        clearPasswordRecoveryData(
          state,
          ADMIN_PASSWORD_RECOVERY_PHASE.RESET_SUCCEEDED
        );
        state.notices.passwordRecovery = null;
        state.notices.passwordResetSuccess = successMessage;

        resetRequestState(state.requests.requestPasswordReset);
        resetRequestState(state.requests.resendPasswordResetOtp);
        resetRequestState(state.requests.verifyPasswordResetOtp);

        setRequestSucceeded(state.requests.resetPassword, successMessage);
      })
      .addCase(resetAdminPasswordThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.resetPassword, action)) {
          return;
        }

        setRequestFailed(
          state.requests.resetPassword,
          getRejectedActionErrorMessage(
            action,
            "Unable to reset the password. Please try again."
          )
        );

        if (
          action.payload?.reason === PASSWORD_RESET_REJECTION_REASON.OTP_INVALID
        ) {
          state.passwordRecovery.verifiedOtp = null;
          state.passwordRecovery.phase =
            ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED;
          state.notices.passwordRecovery =
            ADMIN_PASSWORD_RECOVERY_NOTICE.OTP_REPLACED;

          resetRequestState(state.requests.verifyPasswordResetOtp);
        }
      })

      // -------------------- Sign out --------------------

      .addCase(signOutAdminThunk.pending, (state, action) => {
        setRequestPending(state.requests.signOut, action.meta.requestId);
      })
      .addCase(signOutAdminThunk.fulfilled, (state, action) => {
        if (!isOwnedRequest(state.requests.signOut, action)) {
          return;
        }

        clearAdminAuthenticationBoundaryState(state);

        setRequestSucceeded(
          state.requests.signOut,
          action.payload?.message || null
        );
      })
      .addCase(signOutAdminThunk.rejected, (state, action) => {
        if (!isOwnedRequest(state.requests.signOut, action)) {
          return;
        }

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
  selectHasAdminSessionInitializationFailed,
  selectAdminSessionInitializationError,

  // Sign In request
  selectIsAdminSignInPending,
  selectAdminSignInError,

  // Sign Out request
  selectIsAdminSignOutPending,

  // Password-recovery workflow data
  selectAdminPasswordRecovery,
  selectAdminPasswordRecoveryNotice,
  selectAdminPasswordResetCompletionMessage,

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

  // Password reset
  selectAdminPasswordResetRequest,
  selectIsAdminPasswordResetPending,
  selectAdminPasswordResetError,
  selectAdminPasswordResetSuccessMessage,
} = authSlice.selectors;

// -----------------------------------------------------------------------------
// Synchronous actions
// -----------------------------------------------------------------------------

export const {
  setAdminAccessToken,
  invalidateAdminSession,
  restoreAdminPasswordRecoverySession,
  repairAdminPasswordRecoveryState,
  setAdminPasswordRecoveryEmail,
  cancelAdminPasswordRecovery,
  completeAdminPasswordRecoveryNavigation,
  consumeAdminPasswordRecoveryNotice,
  consumeAdminPasswordResetSuccessMessage,
  clearAdminSignInRequestFeedback,
  clearAdminPasswordResetOtpRequestFeedback,
  clearAdminPasswordResetOtpResendFeedback,
  clearAdminPasswordResetOtpVerificationFeedback,
  clearAdminPasswordResetFeedback,
} = authSlice.actions;

export default authSlice.reducer;
