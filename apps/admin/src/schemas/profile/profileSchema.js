import { z } from "zod";

import { optionalImageSchema } from "../common/imageSchema.js";

export const PROFILE_AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

function hasValidPhoneCharacters(value) {
  return /^[+\d\s()-]+$/.test(value);
}

function hasValidPhoneDigitCount(value) {
  const digitCount = value.replace(/\D/g, "").length;

  return digitCount >= 7 && digitCount <= 15;
}

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .min(2, "Full name must contain at least 2 characters.")
    .max(80, "Full name must not exceed 80 characters."),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number must not exceed 30 characters.")
    .refine(
      (value) => !value || hasValidPhoneCharacters(value),
      "Use only numbers, spaces, +, -, and parentheses."
    )
    .refine(
      (value) => !value || hasValidPhoneDigitCount(value),
      "Phone number must contain between 7 and 15 digits."
    ),

  avatar: optionalImageSchema,
});
