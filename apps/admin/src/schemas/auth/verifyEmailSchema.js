import { z } from "zod";

export const verifyEmailSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, "Verification code is required.")
    .regex(/^\d+$/, "Verification code must contain only numbers.")
    .length(6, "Verification code must be 6 digits."),
});
