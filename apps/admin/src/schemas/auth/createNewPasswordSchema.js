import { z } from "zod";

export const createNewPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(6, "New password must contain at least 6 characters"),

    confirmNewPassword: z.string().min(1, "Confirm new password is required"),
  })
  .refine((formData) => formData.newPassword === formData.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
