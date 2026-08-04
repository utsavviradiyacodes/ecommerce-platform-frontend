import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),

    newPassword: z
      .string()
      .min(1, "New password is required.")
      .min(6, "New password must contain at least 6 characters."),

    confirmNewPassword: z
      .string()
      .min(1, "Confirm your new password."),
  })
  .superRefine((passwords, context) => {
    if (
      passwords.currentPassword &&
      passwords.newPassword &&
      passwords.currentPassword === passwords.newPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from current password.",
      });
    }

    if (
      passwords.newPassword &&
      passwords.confirmNewPassword &&
      passwords.newPassword !== passwords.confirmNewPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmNewPassword"],
        message: "New password and confirmation do not match.",
      });
    }
  });
