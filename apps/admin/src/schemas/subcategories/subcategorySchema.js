import { z } from "zod";
import { optionalImageSchema } from "../common/imageSchema.js";

export const subcategorySchema = z.object({
  name: z.string().trim().min(1, "Subcategory name is required"),
  categoryId: z.string().trim().min(1, "Parent category is required"),
  image: optionalImageSchema,
});
