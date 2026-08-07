import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getCurrentAdmin,
  refreshAdminAccessToken,
  resendAdminEmailVerificationOtp,
  requestAdminPasswordReset,
  resetAdminPassword,
  signInAdmin,
  signOutAdmin,
  verifyAdminEmailOtp,
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

import { normalizeAuthenticatedAdminData } from "./adminData.js";
import {
  ADMIN_AUTH_REJECTION_KIND,
  ADMIN_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  ADMIN_EMAIL_VERIFICATION_RESEND_SUCCESS_MESSAGE,
  ADMIN_EMAIL_VERIFICATION_ROLE,
  ADMIN_EMAIL_VERIFICATION_SESSION_LIFETIME_MS,
  ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE,
} from "./adminEmailVerificationConstants.js";
import {
  isAdminEmailVerificationSessionValid,
  normalizeAdminEmailVerificationSession,
} from "../../utils/storage/adminEmailVerificationSession.js";
import {
  clearAdminPasswordResetSecret,
  readAdminPasswordResetSecret,
  setAdminPasswordResetSecret,
} from "./adminPasswordResetSecret.js";

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

const ADMIN_SESSION_INVALIDATION_NOTICE =
  "Your admin session has expired. Please sign in again.";

let signInRequestSequence = 0;
let verifyEmailRequestSequence = 0;
let verifyPasswordResetOtpRequestSequence = 0;
let resetPasswordRequestSequence = 0;

function createSafeRequestId(prefix, sequence) {
  return `${prefix}-${Date.now()}-${sequence}`;
}

export function createAdminSignInRequestId() {
  return createSafeRequestId("sign-in", ++signInRequestSequence);
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getEmailVerificationRequiredRejection(error, submittedEmail) {
  const responseData = error?.response?.data;
  const verificationData = responseData?.data;
  const userId =
    typeof verificationData?.userId === "string"
      ? verificationData.userId.trim()
      : "";
  const role =
    typeof verificationData?.role === "string"
      ? verificationData.role.trim().toLowerCase()
      : "";
  const email = normalizeEmail(submittedEmail);

  if (
    error?.response?.status !== 403 ||
    !userId ||
    !email ||
    role !== ADMIN_EMAIL_VERIFICATION_ROLE
  ) {
    return null;
  }

  return {
    kind: ADMIN_AUTH_REJECTION_KIND.EMAIL_VERIFICATION_REQUIRED,
    message: getApiErrorMessage(
      error,
      "Email verification is required before signing in."
    ),
    verificationContext: {
      userId,
      email,
      role: ADMIN_EMAIL_VERIFICATION_ROLE,
    },
  };
}

const initialState = {
  admin: null,
  accessToken: null,
  sessionGeneration: 0,

  passwordRecovery: {
    email: "",
    userId: null,
    resendAvailableAt: null,
    phase: ADMIN_PASSWORD_RECOVERY_PHASE.IDLE,
  },

  emailVerification: {
    context: null,
  },

  notices: {
    passwordRecovery: null,
    passwordResetSuccess: null,
    sessionInvalidation: null,
  },

  requests: {
    initializeSession: createRequestState(),
    signIn: createRequestState(),
    signOut: createRequestState(),
    requestPasswordReset: createRequestState(),
    resendPasswordResetOtp: createRequestState(),
    verifyPasswordResetOtp: createRequestState(),
    resetPassword: createRequestState(),
    verifyEmail: createRequestState(),
    resendEmailVerificationOtp: createRequestState(),
  },
};

function resetEmailVerificationRequestStates(state) {
  resetRequestState(state.requests.verifyEmail);
  resetRequestState(state.requests.resendEmailVerificationOtp);
}

function clearEmailVerificationData(state) {
  state.emailVerification.context = null;
  resetEmailVerificationRequestStates(state);
}

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
  state.passwordRecovery.phase = phase;
}

function clearAdminAuthenticationBoundaryState(state) {
  state.admin = null;
  state.accessToken = null;

  clearPasswordRecoveryData(state);
  state.notices.passwordRecovery = null;
  state.notices.passwordResetSuccess = null;
  state.notices.sessionInvalidation = null;

  clearEmailVerificationData(state);

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
    phase: ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED,
  };
}

function createVerifiedPasswordRecovery(passwordRecovery, userId) {
  return {
    ...passwordRecovery,
    userId,
    phase: ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED,
  };
}

function isCurrentAdminPasswordResetWorkflow(
  authState,
  requestId,
  userId
) {
  return (
    isRequestStateOwnedBy(authState.requests.resetPassword, requestId) &&
    authState.passwordRecovery.phase ===
      ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED &&
    authState.passwordRecovery.userId === userId &&
    isAdminPasswordRecoveryStateValid(authState.passwordRecovery)
  );
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
// Resend a newly created Admin email-verification OTP
// -----------------------------------------------------------------------------

export const resendAdminEmailVerificationThunk = createAsyncThunk(
  "auth/resendAdminEmailVerification",
  async ({ userId }, { getState, rejectWithValue, signal }) => {
    const currentContext = getState().auth.emailVerification.context;

    try {
      await resendAdminEmailVerificationOtp({ userId, signal });

      const currentTime = Date.now();
      const updatedContext = normalizeAdminEmailVerificationSession({
        ...currentContext,
        expiresAt:
          currentTime + ADMIN_EMAIL_VERIFICATION_SESSION_LIFETIME_MS,
        resendAvailableAt:
          currentTime + ADMIN_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
      });

      if (!isAdminEmailVerificationSessionValid(updatedContext, currentTime)) {
        throw new Error("The verification session could not be updated.");
      }

      return {
        context: updatedContext,
        message: ADMIN_EMAIL_VERIFICATION_RESEND_SUCCESS_MESSAGE,
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
    condition: ({ userId }, { getState }) => {
      const { emailVerification, requests } = getState().auth;
      const context = emailVerification.context;
      const resendAvailableAt = context?.resendAvailableAt;

      return (
        isAdminEmailVerificationSessionValid(context) &&
        context.userId === userId &&
        (resendAvailableAt == null || resendAvailableAt <= Date.now()) &&
        requests.verifyEmail.status !== REQUEST_STATUS.PENDING &&
        requests.resendEmailVerificationOtp.status !== REQUEST_STATUS.PENDING
      );
    },
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
    signInAdminStarted(state, action) {
      clearEmailVerificationData(state);
      setRequestPending(state.requests.signIn, action.payload.requestId);
    },

    signInAdminSucceeded(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.signIn,
          action.payload.requestId
        )
      ) {
        return;
      }

      state.accessToken = action.payload.accessToken;
      state.admin = action.payload.admin;

      clearEmailVerificationData(state);
      clearPasswordRecoveryData(state);
      state.notices.passwordRecovery = null;
      state.notices.passwordResetSuccess = null;
      state.notices.sessionInvalidation = null;
      resetPasswordRecoveryRequestStates(state);

      setRequestSucceeded(
        state.requests.signIn,
        action.payload.message || null
      );
    },

    signInAdminFailed(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.signIn,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestFailed(state.requests.signIn, action.payload.error);
    },

    abandonAdminSignInRequest(state, action) {
      const requestId = action.payload?.requestId;

      if (
        state.requests.signIn.status !== REQUEST_STATUS.PENDING ||
        !isRequestStateOwnedBy(state.requests.signIn, requestId)
      ) {
        return;
      }

      resetRequestState(state.requests.signIn);
    },

    verifyAdminEmailStarted(state, action) {
      setRequestPending(state.requests.verifyEmail, action.payload.requestId);
    },

    verifyAdminEmailSucceeded(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.verifyEmail,
          action.payload.requestId
        )
      ) {
        return;
      }

      state.admin = action.payload.admin;
      state.accessToken = action.payload.accessToken;

      clearRequestFeedback(state.requests.signIn);
      clearPasswordRecoveryData(state);
      state.notices.passwordRecovery = null;
      state.notices.passwordResetSuccess = null;
      state.notices.sessionInvalidation = null;
      resetPasswordRecoveryRequestStates(state);
      clearEmailVerificationData(state);
    },

    verifyAdminEmailFailed(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.verifyEmail,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestFailed(state.requests.verifyEmail, action.payload.error);
    },

    verifyAdminPasswordResetOtpStarted(state, action) {
      setRequestPending(
        state.requests.verifyPasswordResetOtp,
        action.payload.requestId
      );
      state.notices.passwordRecovery = null;
    },

    verifyAdminPasswordResetOtpSucceeded(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.verifyPasswordResetOtp,
          action.payload.requestId
        )
      ) {
        return;
      }

      const nextPasswordRecovery = createVerifiedPasswordRecovery(
        state.passwordRecovery,
        action.payload.userId
      );

      if (
        action.payload.userId !== state.passwordRecovery.userId ||
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
        action.payload.message || null
      );
    },

    verifyAdminPasswordResetOtpFailed(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.verifyPasswordResetOtp,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestFailed(
        state.requests.verifyPasswordResetOtp,
        action.payload.error
      );
    },

    resetAdminPasswordStarted(state, action) {
      setRequestPending(
        state.requests.resetPassword,
        action.payload.requestId
      );
    },

    resetAdminPasswordSucceeded(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.resetPassword,
          action.payload.requestId
        )
      ) {
        return;
      }

      const successMessage =
        action.payload.message ||
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
    },

    resetAdminPasswordFailed(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.resetPassword,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestFailed(state.requests.resetPassword, action.payload.error);

      if (action.payload.reason === PASSWORD_RESET_REJECTION_REASON.OTP_INVALID) {
        state.passwordRecovery.phase =
          ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED;
        state.notices.passwordRecovery =
          ADMIN_PASSWORD_RECOVERY_NOTICE.OTP_REPLACED;
        resetRequestState(state.requests.verifyPasswordResetOtp);
      }
    },

    endAdminPasswordResetSecretSession(state) {
      if (
        state.passwordRecovery.phase !==
        ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED
      ) {
        return;
      }

      state.passwordRecovery.phase =
        ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED;
      state.notices.passwordRecovery =
        ADMIN_PASSWORD_RECOVERY_NOTICE.SECURE_RESET_SESSION_ENDED;
      resetRequestState(state.requests.verifyPasswordResetOtp);
      resetRequestState(state.requests.resetPassword);
    },

    setAdminAccessToken(state, action) {
      state.accessToken = action.payload;
    },

    synchronizeCurrentAdmin: {
      reducer(state, action) {
        state.admin = action.payload;
      },

      prepare(admin) {
        return {
          payload: normalizeAuthenticatedAdminData(admin),
        };
      },
    },

    invalidateAdminSession(state) {
      clearAdminAuthenticationBoundaryState(state);
      state.notices.sessionInvalidation =
        ADMIN_SESSION_INVALIDATION_NOTICE;
    },

    setAdminEmailVerificationContext(state, action) {
      const context = normalizeAdminEmailVerificationSession(action.payload);

      if (!isAdminEmailVerificationSessionValid(context)) {
        clearEmailVerificationData(state);
        return;
      }

      state.emailVerification.context = context;
      resetEmailVerificationRequestStates(state);
      clearRequestFeedback(state.requests.signIn);

      clearPasswordRecoveryData(state);
      state.notices.passwordRecovery = null;
      resetPasswordRecoveryRequestStates(state);
    },

    restoreAdminEmailVerificationSession(state, action) {
      const context = normalizeAdminEmailVerificationSession(action.payload);

      if (!isAdminEmailVerificationSessionValid(context)) {
        clearEmailVerificationData(state);
        return;
      }

      state.emailVerification.context = context;
      resetEmailVerificationRequestStates(state);

      clearPasswordRecoveryData(state);
      state.notices.passwordRecovery = null;
      resetPasswordRecoveryRequestStates(state);
    },

    updateAdminEmailVerificationContext(state, action) {
      const currentContext = state.emailVerification.context;
      const context = normalizeAdminEmailVerificationSession({
        ...currentContext,
        expiresAt: action.payload?.expiresAt,
        resendAvailableAt: action.payload?.resendAvailableAt,
        userId: currentContext?.userId,
        email: currentContext?.email,
        role: currentContext?.role,
        createdAt: currentContext?.createdAt,
      });

      if (!isAdminEmailVerificationSessionValid(context)) {
        clearEmailVerificationData(state);
        return;
      }

      state.emailVerification.context = context;
    },

    clearAdminEmailVerificationState(state) {
      clearEmailVerificationData(state);
    },

    clearAdminEmailVerificationFeedback(state) {
      clearRequestFeedback(state.requests.verifyEmail);
      clearRequestFeedback(state.requests.resendEmailVerificationOtp);
    },

    clearAdminEmailVerificationRequestFeedback(state) {
      clearRequestFeedback(state.requests.verifyEmail);
    },

    clearAdminEmailVerificationResendFeedback(state) {
      clearRequestFeedback(state.requests.resendEmailVerificationOtp);
    },

    restoreAdminPasswordRecoverySession(state, action) {
      state.passwordRecovery.email = action.payload.email;
      state.passwordRecovery.userId = action.payload.userId;
      state.passwordRecovery.resendAvailableAt =
        action.payload.resendAvailableAt;
      state.passwordRecovery.phase = action.payload.phase;
    },

    repairAdminPasswordRecoveryState(state) {
      const safePhase = getSafeAdminPasswordRecoveryPhase(
        state.passwordRecovery
      );

      if (safePhase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED) {
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
        state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;

        resetPasswordRecoveryRequestStates(state);
      }
    },

    setAdminPasswordRecoveryEmail(state, action) {
      clearEmailVerificationData(state);

      state.passwordRecovery.email =
        typeof action.payload === "string" ? action.payload.trim() : "";
      state.passwordRecovery.userId = null;
      state.passwordRecovery.resendAvailableAt = null;
      state.passwordRecovery.phase = ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
      state.notices.passwordRecovery = null;

      resetPasswordRecoveryRequestStates(state);
    },

    cancelAdminPasswordRecovery(state) {
      clearPasswordRecoveryData(state, ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED);

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

    consumeAdminSessionInvalidationNotice(state) {
      state.notices.sessionInvalidation = null;
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

    selectAdminSessionGeneration: (sliceState) =>
      sliceState.sessionGeneration,

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

    // -------------------- Email-verification workflow --------------------

    selectAdminEmailVerificationContext: (sliceState) =>
      sliceState.emailVerification.context,

    selectAdminEmailVerificationRequest: (sliceState) =>
      sliceState.requests.verifyEmail,

    selectIsAdminEmailVerificationPending: (sliceState) =>
      sliceState.requests.verifyEmail.status === REQUEST_STATUS.PENDING,

    selectAdminEmailVerificationError: (sliceState) =>
      sliceState.requests.verifyEmail.error,

    selectAdminEmailVerificationResendRequest: (sliceState) =>
      sliceState.requests.resendEmailVerificationOtp,

    selectIsAdminEmailVerificationResendPending: (sliceState) =>
      sliceState.requests.resendEmailVerificationOtp.status ===
      REQUEST_STATUS.PENDING,

    selectAdminEmailVerificationResendError: (sliceState) =>
      sliceState.requests.resendEmailVerificationOtp.error,

    selectAdminEmailVerificationResendSuccessMessage: (sliceState) =>
      sliceState.requests.resendEmailVerificationOtp.successMessage,

    // -------------------- Sign Out request --------------------

    selectIsAdminSignOutPending: (sliceState) =>
      sliceState.requests.signOut.status === REQUEST_STATUS.PENDING,

    selectAdminSignOutError: (sliceState) =>
      sliceState.requests.signOut.error,

    // -------------------- Password-recovery workflow data --------------------

    selectAdminPasswordRecovery: (sliceState) => sliceState.passwordRecovery,

    selectAdminPasswordRecoveryNotice: (sliceState) =>
      sliceState.notices.passwordRecovery,

    selectAdminPasswordResetCompletionMessage: (sliceState) =>
      sliceState.notices.passwordResetSuccess,

    selectAdminSessionInvalidationNotice: (sliceState) =>
      sliceState.notices.sessionInvalidation,

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
          clearEmailVerificationData(state);
        } else {
          state.admin = null;
          state.accessToken = null;
        }

        state.notices.sessionInvalidation = null;

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

      // -------------------- Resend Admin email-verification OTP --------------------

      .addCase(
        resendAdminEmailVerificationThunk.pending,
        (state, action) => {
          setRequestPending(
            state.requests.resendEmailVerificationOtp,
            action.meta.requestId
          );
          clearRequestFeedback(state.requests.verifyEmail);
        }
      )
      .addCase(
        resendAdminEmailVerificationThunk.fulfilled,
        (state, action) => {
          if (
            !isOwnedRequest(
              state.requests.resendEmailVerificationOtp,
              action
            )
          ) {
            return;
          }

          const currentContext = state.emailVerification.context;
          const updatedContext = normalizeAdminEmailVerificationSession(
            action.payload?.context
          );
          const isSameWorkflow = Boolean(
            currentContext &&
              updatedContext &&
              currentContext.userId === updatedContext.userId &&
              currentContext.email === updatedContext.email &&
              currentContext.role === updatedContext.role &&
              currentContext.createdAt === updatedContext.createdAt
          );

          if (
            !isSameWorkflow ||
            !isAdminEmailVerificationSessionValid(updatedContext)
          ) {
            setRequestFailed(
              state.requests.resendEmailVerificationOtp,
              ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE
            );
            return;
          }

          state.emailVerification.context = updatedContext;
          resetRequestState(state.requests.verifyEmail);
          setRequestSucceeded(
            state.requests.resendEmailVerificationOtp,
            action.payload?.message ||
              ADMIN_EMAIL_VERIFICATION_RESEND_SUCCESS_MESSAGE
          );
        }
      )
      .addCase(
        resendAdminEmailVerificationThunk.rejected,
        (state, action) => {
          if (
            !isOwnedRequest(
              state.requests.resendEmailVerificationOtp,
              action
            )
          ) {
            return;
          }

          if (action.meta.aborted || action.meta.condition) {
            resetRequestState(state.requests.resendEmailVerificationOtp);
            return;
          }

          setRequestFailed(
            state.requests.resendEmailVerificationOtp,
            getRejectedActionErrorMessage(
              action,
              "Unable to resend the verification code. Please try again."
            )
          );
        }
      )

      // -------------------- Request password-reset OTP --------------------

      .addCase(requestAdminPasswordResetThunk.pending, (state, action) => {
        clearEmailVerificationData(state);
        setRequestPending(
          state.requests.requestPasswordReset,
          action.meta.requestId
        );

        state.passwordRecovery.email = action.meta.arg;
        state.passwordRecovery.userId = null;
        state.passwordRecovery.resendAvailableAt = null;
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
  selectAdminSessionGeneration,
  selectIsAdminAuthenticated,

  // Session initialization request
  selectIsAdminSessionInitializationPending,
  selectHasAdminSessionInitializationFailed,
  selectAdminSessionInitializationError,

  // Sign In request
  selectIsAdminSignInPending,
  selectAdminSignInError,

  // Email-verification workflow
  selectAdminEmailVerificationContext,
  selectAdminEmailVerificationRequest,
  selectIsAdminEmailVerificationPending,
  selectAdminEmailVerificationError,
  selectAdminEmailVerificationResendRequest,
  selectIsAdminEmailVerificationResendPending,
  selectAdminEmailVerificationResendError,
  selectAdminEmailVerificationResendSuccessMessage,

  // Sign Out request
  selectIsAdminSignOutPending,
  selectAdminSignOutError,

  // Password-recovery workflow data
  selectAdminPasswordRecovery,
  selectAdminPasswordRecoveryNotice,
  selectAdminPasswordResetCompletionMessage,
  selectAdminSessionInvalidationNotice,

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
  signInAdminStarted,
  signInAdminSucceeded,
  signInAdminFailed,
  abandonAdminSignInRequest,
  verifyAdminEmailStarted,
  verifyAdminEmailSucceeded,
  verifyAdminEmailFailed,
  verifyAdminPasswordResetOtpStarted,
  verifyAdminPasswordResetOtpSucceeded,
  verifyAdminPasswordResetOtpFailed,
  resetAdminPasswordStarted,
  resetAdminPasswordSucceeded,
  resetAdminPasswordFailed,
  endAdminPasswordResetSecretSession,
  setAdminAccessToken,
  synchronizeCurrentAdmin,
  invalidateAdminSession,
  setAdminEmailVerificationContext,
  restoreAdminEmailVerificationSession,
  updateAdminEmailVerificationContext,
  clearAdminEmailVerificationState,
  clearAdminEmailVerificationFeedback,
  clearAdminEmailVerificationRequestFeedback,
  clearAdminEmailVerificationResendFeedback,
  restoreAdminPasswordRecoverySession,
  repairAdminPasswordRecoveryState,
  setAdminPasswordRecoveryEmail,
  cancelAdminPasswordRecovery,
  completeAdminPasswordRecoveryNavigation,
  consumeAdminPasswordRecoveryNotice,
  consumeAdminPasswordResetSuccessMessage,
  consumeAdminSessionInvalidationNotice,
  clearAdminSignInRequestFeedback,
  clearAdminPasswordResetOtpRequestFeedback,
  clearAdminPasswordResetOtpResendFeedback,
  clearAdminPasswordResetOtpVerificationFeedback,
  clearAdminPasswordResetFeedback,
} = authSlice.actions;

// -----------------------------------------------------------------------------
// Secret-safe custom thunks
// -----------------------------------------------------------------------------

export function signInAdminThunk(credentials, { requestId } = {}) {
  return async (dispatch, getState) => {
    if (getState().auth.requests.signIn.status === REQUEST_STATUS.PENDING) {
      return { success: false, skipped: true };
    }

    const email = normalizeEmail(credentials?.email);
    const ownedRequestId =
      typeof requestId === "string" && requestId.trim()
        ? requestId.trim()
        : createAdminSignInRequestId();

    dispatch(signInAdminStarted({ requestId: ownedRequestId }));

    try {
      const response = await signInAdmin({
        email,
        password: credentials?.password,
      });

      if (
        !isRequestStateOwnedBy(
          getState().auth.requests.signIn,
          ownedRequestId
        )
      ) {
        return { success: false, stale: true };
      }

      const resultAction = signInAdminSucceeded({
        requestId: ownedRequestId,
        accessToken: response.data.token,
        admin: response.data.admin,
        message: response.message || null,
      });

      dispatch(resultAction);
      return resultAction;
    } catch (error) {
      if (
        !isRequestStateOwnedBy(
          getState().auth.requests.signIn,
          ownedRequestId
        )
      ) {
        return { success: false, stale: true };
      }

      const verificationRequired =
        getEmailVerificationRequiredRejection(error, email);
      const errorMessage =
        verificationRequired?.message ||
        getApiErrorMessage(error, "Unable to sign in. Please try again.");
      const resultAction = signInAdminFailed({
        requestId: ownedRequestId,
        error: errorMessage,
        kind: verificationRequired?.kind || null,
        verificationContext:
          verificationRequired?.verificationContext || null,
      });

      dispatch(resultAction);
      return resultAction;
    }
  };
}

export function verifyAdminEmailThunk({ userId, otp } = {}) {
  return async (dispatch, getState) => {
    const { emailVerification, requests } = getState().auth;
    const context = emailVerification.context;

    if (
      !isAdminEmailVerificationSessionValid(context) ||
      context.userId !== userId ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp) ||
      requests.verifyEmail.status === REQUEST_STATUS.PENDING ||
      requests.resendEmailVerificationOtp.status === REQUEST_STATUS.PENDING
    ) {
      return { success: false, skipped: true };
    }

    const requestId = createSafeRequestId(
      "verify-admin-email",
      ++verifyEmailRequestSequence
    );

    dispatch(verifyAdminEmailStarted({ requestId }));

    try {
      const response = await verifyAdminEmailOtp({ userId, otp });

      if (
        !isRequestStateOwnedBy(
          getState().auth.requests.verifyEmail,
          requestId
        )
      ) {
        return { success: false, stale: true };
      }

      const resultAction = verifyAdminEmailSucceeded({
        requestId,
        accessToken: response.data.token,
        admin: response.data.admin,
        message: response.message || null,
      });

      dispatch(resultAction);
      return resultAction;
    } catch (error) {
      if (
        !isRequestStateOwnedBy(
          getState().auth.requests.verifyEmail,
          requestId
        )
      ) {
        return { success: false, stale: true };
      }

      const resultAction = verifyAdminEmailFailed({
        requestId,
        error: getApiErrorMessage(
          error,
          "Unable to verify the account. Please try again."
        ),
      });

      dispatch(resultAction);
      return resultAction;
    }
  };
}

export function verifyAdminPasswordResetOtpThunk({ userId, otp } = {}) {
  return async (dispatch, getState) => {
    const { passwordRecovery, requests } = getState().auth;

    if (
      passwordRecovery.phase !==
        ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED ||
      !isAdminPasswordRecoveryStateValid(passwordRecovery) ||
      passwordRecovery.userId !== userId ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp) ||
      requests.resendPasswordResetOtp.status === REQUEST_STATUS.PENDING ||
      requests.verifyPasswordResetOtp.status === REQUEST_STATUS.PENDING
    ) {
      return { success: false, skipped: true };
    }

    clearAdminPasswordResetSecret();

    const requestId = createSafeRequestId(
      "verify-password-reset",
      ++verifyPasswordResetOtpRequestSequence
    );

    dispatch(verifyAdminPasswordResetOtpStarted({ requestId }));

    try {
      const response = await verifyAdminPasswordResetOtp({ userId, otp });
      const currentAuthState = getState().auth;

      if (
        !isRequestStateOwnedBy(
          currentAuthState.requests.verifyPasswordResetOtp,
          requestId
        ) ||
        currentAuthState.passwordRecovery.userId !== userId
      ) {
        return { success: false, stale: true };
      }

      if (
        response.success !== true ||
        response.userId !== userId ||
        !setAdminPasswordResetSecret({ userId, otp })
      ) {
        const resultAction = verifyAdminPasswordResetOtpFailed({
          requestId,
          error: ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE,
        });

        dispatch(resultAction);
        return resultAction;
      }

      const resultAction = verifyAdminPasswordResetOtpSucceeded({
        requestId,
        userId,
        message: response.message || null,
      });

      dispatch(resultAction);
      return resultAction;
    } catch (error) {
      if (
        !isRequestStateOwnedBy(
          getState().auth.requests.verifyPasswordResetOtp,
          requestId
        )
      ) {
        return { success: false, stale: true };
      }

      const resultAction = verifyAdminPasswordResetOtpFailed({
        requestId,
        error: getApiErrorMessage(
          error,
          "Unable to verify the reset code. Please try again."
        ),
      });

      dispatch(resultAction);
      return resultAction;
    }
  };
}

export function resetAdminPasswordThunk(passwordData) {
  return async (dispatch, getState) => {
    const { passwordRecovery, requests } = getState().auth;

    if (requests.resetPassword.status === REQUEST_STATUS.PENDING) {
      return { success: false, skipped: true };
    }

    if (
      passwordRecovery.phase !==
        ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED ||
      !isAdminPasswordRecoveryStateValid(passwordRecovery)
    ) {
      clearAdminPasswordResetSecret();
      return { success: false, skipped: true };
    }

    const resetSecret = readAdminPasswordResetSecret(
      passwordRecovery.userId
    );

    if (!resetSecret) {
      const resultAction = endAdminPasswordResetSecretSession();

      dispatch(resultAction);
      return resultAction;
    }

    const requestId = createSafeRequestId(
      "reset-admin-password",
      ++resetPasswordRequestSequence
    );
    const recoveryUserId = passwordRecovery.userId;

    dispatch(resetAdminPasswordStarted({ requestId }));

    try {
      const response = await resetAdminPassword({
        userId: resetSecret.userId,
        otp: resetSecret.otp,
        newPassword: passwordData?.newPassword,
        confirmNewPassword: passwordData?.confirmNewPassword,
      });

      if (
        !isCurrentAdminPasswordResetWorkflow(
          getState().auth,
          requestId,
          recoveryUserId
        )
      ) {
        return { success: false, stale: true };
      }

      clearAdminPasswordResetSecret();

      const resultAction = resetAdminPasswordSucceeded({
        requestId,
        message: response.message || null,
      });

      dispatch(resultAction);
      return resultAction;
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        "Unable to reset the password. Please try again."
      );
      const isInvalidOrExpiredOtp =
        error?.response?.status === 400 &&
        INVALID_OR_EXPIRED_OTP_MESSAGES.has(errorMessage);

      if (
        !isCurrentAdminPasswordResetWorkflow(
          getState().auth,
          requestId,
          recoveryUserId
        )
      ) {
        return { success: false, stale: true };
      }

      if (isInvalidOrExpiredOtp) {
        clearAdminPasswordResetSecret();
      }

      const resultAction = resetAdminPasswordFailed({
        requestId,
        error: errorMessage,
        reason: isInvalidOrExpiredOtp
          ? PASSWORD_RESET_REJECTION_REASON.OTP_INVALID
          : null,
      });

      dispatch(resultAction);
      return resultAction;
    }
  };
}

export default authSlice.reducer;
