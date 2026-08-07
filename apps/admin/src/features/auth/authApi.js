import axiosInstance from "../../api/axiosInstance.js";
import {
  normalizeAdminAuthenticationData,
  normalizeAuthenticatedAdminData,
} from "./adminData.js";

import {
  ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE,
  isNonEmptyString,
} from "./authConstants.js";
import {
  ADMIN_EMAIL_VERIFICATION_ROLE,
  ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE,
} from "./adminEmailVerificationConstants.js";

const ADMIN_SESSION_UNEXPECTED_RESPONSE_MESSAGE =
  "Received an unexpected response. Please try again.";

function sanitizePasswordRecoveryResponse(data) {
  if (data?.success !== true || !isNonEmptyString(data?.userId)) {
    throw new Error(ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message: typeof data?.message === "string" ? data.message : null,
    userId: data.userId.trim(),
  };
}

function isNonArrayObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeAdminAuthenticationResponse(responseData) {
  if (
    responseData?.success !== true ||
    !isNonArrayObject(responseData?.data)
  ) {
    throw new Error(ADMIN_SESSION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message:
      typeof responseData.message === "string" ? responseData.message : null,
    data: normalizeAdminAuthenticationData(responseData.data),
  };
}

export async function signInAdmin(credentials) {
  const { email, password } = credentials;

  const response = await axiosInstance.post(
    "/auth/login",
    {
      email,
      password,
      role: "admin",
    },
    {
      skipAuthRefresh: true,
    }
  );

  return sanitizeAdminAuthenticationResponse(response.data);
}

export async function verifyAdminEmailOtp({ userId, otp, signal } = {}) {
  const normalizedUserId =
    typeof userId === "string" ? userId.trim() : "";

  if (!normalizedUserId || typeof otp !== "string") {
    throw new Error(ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  const response = await axiosInstance.post(
    "/auth/verifyOTP",
    {
      userId: normalizedUserId,
      otp,
      role: ADMIN_EMAIL_VERIFICATION_ROLE,
    },
    {
      signal,
      skipAuthRefresh: true,
    }
  );

  const sanitizedResponse = sanitizeAdminAuthenticationResponse(response.data);

  if (
    sanitizedResponse.data.admin._id !== normalizedUserId ||
    sanitizedResponse.data.admin.role !== ADMIN_EMAIL_VERIFICATION_ROLE ||
    sanitizedResponse.data.admin.isVerified !== true
  ) {
    throw new Error(ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return sanitizedResponse;
}

export async function resendAdminEmailVerificationOtp({ userId, signal } = {}) {
  const normalizedUserId =
    typeof userId === "string" ? userId.trim() : "";

  if (!normalizedUserId) {
    throw new Error(ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  const response = await axiosInstance.post(
    "/auth/resendOTP",
    {
      userId: normalizedUserId,
    },
    {
      signal,
      skipAuthRefresh: true,
    }
  );

  if (response.data?.success !== true) {
    throw new Error(ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    message:
      typeof response.data.message === "string"
        ? response.data.message.trim() || null
        : null,
  };
}

export async function requestAdminPasswordReset(email) {
  const response = await axiosInstance.post(
    "/auth/forgotPassword",
    {
      email,
      role: "admin",
    },
    {
      skipAuthRefresh: true,
    }
  );

  return sanitizePasswordRecoveryResponse(response.data);
}

export async function verifyAdminPasswordResetOtp(verificationData) {
  const { userId, otp } = verificationData;

  const response = await axiosInstance.post(
    "/auth/verifyPasswordResetOTP",
    {
      userId,
      otp,
    },
    {
      skipAuthRefresh: true,
    }
  );

  const sanitizedResponse = sanitizePasswordRecoveryResponse(response.data);

  if (sanitizedResponse.userId !== userId) {
    throw new Error(ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return sanitizedResponse;
}

export async function resetAdminPassword(passwordResetData) {
  const { userId, otp, newPassword, confirmNewPassword } = passwordResetData;

  const response = await axiosInstance.post(
    "/auth/resetPassword",
    {
      userId,
      otp,
      newPassword,
      confirmNewPassword,
      role: "admin",
    },
    {
      skipAuthRefresh: true,
    }
  );

  if (response.data?.success !== true) {
    throw new Error(ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message:
      typeof response.data?.message === "string" ? response.data.message : null,
  };
}

export async function getCurrentAdmin(
  accessToken,
  { skipAuthRefresh = false } = {}
) {
  const response = await axiosInstance.get("/auth/getMe", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    skipAuthRefresh,
  });

  if (
    response.data?.success !== true ||
    !isNonArrayObject(response.data?.data)
  ) {
    throw new Error(ADMIN_SESSION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message:
      typeof response.data.message === "string" ? response.data.message : null,
    data: normalizeAuthenticatedAdminData(response.data.data),
  };
}

export async function refreshAdminAccessToken() {
  const response = await axiosInstance.post("/auth/refresh", null, {
    headers: {
      "x-role": "admin",
    },
    skipAuthRefresh: true,
  });

  if (
    response.data?.success !== true ||
    !isNonEmptyString(response.data?.token)
  ) {
    throw new Error(ADMIN_SESSION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    token: response.data.token.trim(),
  };
}

export async function signOutAdmin() {
  const response = await axiosInstance.post("/auth/logout", null, {
    headers: {
      "x-role": "admin",
    },
    skipAuthRefresh: true,
  });

  if (response.data?.success !== true) {
    throw new Error(ADMIN_SESSION_UNEXPECTED_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message:
      typeof response.data.message === "string" ? response.data.message : null,
  };
}
