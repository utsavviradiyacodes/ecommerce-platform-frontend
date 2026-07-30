import axiosInstance from "../../api/axiosInstance.js";

export async function signInAdmin(credentials) {
  const { email, password } = credentials;

  const res = await axiosInstance.post("/auth/login", {
    email,
    password,
    role: "admin",
  });

  return res.data;
}

export async function requestAdminPasswordReset(email) {
  const res = await axiosInstance.post("/auth/forgotPassword", {
    email,
    role: "admin",
  });

  return res.data;
}

export async function verifyAdminPasswordResetOtp(verificationData) {
  const { userId, otp } = verificationData;

  const response = await axiosInstance.post("/auth/verifyPasswordResetOTP", {
    userId,
    otp,
  });

  return response.data;
}

export async function getCurrentAdmin(accessToken) {
  const res = await axiosInstance.get("/auth/getMe", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.data;
}

export async function refreshAdminAccessToken() {
  const res = await axiosInstance.post("/auth/refresh", null, {
    headers: {
      "x-role": "admin",
    },
  });

  return res.data;
}

export async function signOutAdmin() {
  const res = await axiosInstance.post("/auth/logout", null, {
    headers: {
      "x-role": "admin",
    },
  });

  return res.data;
}
