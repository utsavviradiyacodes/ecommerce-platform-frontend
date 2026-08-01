import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const categoryImageSchema = z.preprocess(
  (value) => {
    if (value instanceof FileList) {
      return value[0] ?? null;
    }

    return value ?? null;
  },
  z
    .file()
    .mime(ACCEPTED_IMAGE_TYPES, {
      error: "Only JPG, JPEG, PNG, and WebP images are allowed",
    })
    .max(MAX_FILE_SIZE, {
      error: "Image must not exceed 5 MB",
    })
    .nullable()
);

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  image: categoryImageSchema,
});
