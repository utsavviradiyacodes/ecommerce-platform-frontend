import { z } from "zod";
import { optionalImageSchema } from "../common/imageSchema.js";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  image: optionalImageSchema,
});
