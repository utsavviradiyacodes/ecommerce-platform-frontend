import axiosInstance from "../../api/axiosInstance.js";

const UNEXPECTED_SETTINGS_RESPONSE_MESSAGE =
  "Received an unexpected settings response.";

export async function changeAdminPassword(passwordData) {
  const { currentPassword, newPassword, confirmNewPassword } = passwordData;

  const response = await axiosInstance.post("/auth/changePassword", {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });

  if (response.data?.success !== true) {
    throw new Error(UNEXPECTED_SETTINGS_RESPONSE_MESSAGE);
  }

  return {
    success: true,
    message:
      typeof response.data.message === "string" ? response.data.message : null,
  };
}
