import { z } from "zod";

export const verifyResetCodeSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, "Verification code is required.")
    .regex(/^\d{6}$/, "Verification code must contain exactly 6 digits."),
});
