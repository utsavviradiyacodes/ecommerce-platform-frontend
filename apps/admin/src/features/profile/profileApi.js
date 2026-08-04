import axiosInstance from "../../api/axiosInstance.js";

import { normalizeAdminData } from "../auth/adminData.js";

const UNEXPECTED_PROFILE_RESPONSE_MESSAGE =
  "Received an unexpected profile response.";

function normalizeProfileResponse(response) {
  if (response.data?.success !== true) {
    throw new Error(UNEXPECTED_PROFILE_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message:
      typeof response.data.message === "string" ? response.data.message : null,
    data: normalizeAdminData(response.data.data),
  };
}

export async function getAdminProfile({ signal } = {}) {
  const response = await axiosInstance.get("/profile/getProfile", {
    signal,
  });

  return normalizeProfileResponse(response);
}

export async function updateAdminProfile(formData, { signal } = {}) {
  const response = await axiosInstance.post(
    "/profile/updateAdminProfile",
    formData,
    {
      signal,
    }
  );

  return normalizeProfileResponse(response);
}

export async function deleteAdminAvatar({ signal } = {}) {
  const response = await axiosInstance.delete("/profile/deleteAvatar", {
    signal,
  });

  return normalizeProfileResponse(response);
}
