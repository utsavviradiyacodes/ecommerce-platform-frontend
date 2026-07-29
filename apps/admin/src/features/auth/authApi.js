import axiosInstance from "../../api/axiosInstance.js";

export async function loginAdmin(credentials) {
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

export async function logoutAdmin() {
  const res = await axiosInstance.post("/auth/logout", null, {
    headers: {
      "x-role": "admin",
    },
  });

  return res.data;
}
