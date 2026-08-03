import { z } from "zod";

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function normalizeFileSelection(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return Array.from(value);
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return [value];
  }

  return value;
}

function createNumericInputSchema({
  numberSchema,
  requiredMessage,
  invalidMessage,
  optional = false,
}) {
  return z
    .any()
    .transform((value, context) => {
      const normalizedValue =
        typeof value === "string" ? value.trim() : value;

      if (
        normalizedValue === "" ||
        normalizedValue === undefined ||
        normalizedValue === null
      ) {
        if (optional) {
          return undefined;
        }

        context.addIssue({ code: "custom", message: requiredMessage });
        return z.NEVER;
      }

      const numericValue =
        typeof normalizedValue === "number"
          ? normalizedValue
          : Number(normalizedValue);

      if (!Number.isFinite(numericValue)) {
        context.addIssue({ code: "custom", message: invalidMessage });
        return z.NEVER;
      }

      return numericValue;
    })
    .pipe(optional ? numberSchema.optional() : numberSchema);
}

const nameSchema = z
  .string({ error: "Product name is required" })
  .trim()
  .min(3, "Product name must be at least 3 characters")
  .max(100, "Product name cannot exceed 100 characters");

const descriptionSchema = z
  .string({ error: "Description is required" })
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(2000, "Description cannot exceed 2000 characters");

const priceSchema = createNumericInputSchema({
  numberSchema: z.number().gt(0, "Price must be greater than 0"),
  requiredMessage: "Price is required",
  invalidMessage: "Price must be a valid number",
});

const originalPriceSchema = createNumericInputSchema({
  numberSchema: z.number().min(0, "Original price cannot be negative"),
  requiredMessage: "Original price is required",
  invalidMessage: "Original price must be a valid number",
  optional: true,
});

const createStockSchema = createNumericInputSchema({
  numberSchema: z
    .number()
    .int("Stock must be a whole number")
    .min(1, "Stock must be at least 1"),
  requiredMessage: "Stock is required",
  invalidMessage: "Stock must be a valid number",
});

const updateStockSchema = createNumericInputSchema({
  numberSchema: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  requiredMessage: "Stock is required",
  invalidMessage: "Stock must be a valid number",
});

const categoryIdSchema = z
  .string({ error: "Category is required" })
  .trim()
  .min(1, "Category is required");

const subcategoryIdSchema = z
  .string({ error: "Subcategory is required" })
  .trim()
  .min(1, "Subcategory is required");

const tagsSchema = z.preprocess(
  (value) => value ?? "",
  z.string({ error: "Tags must be a comma-separated string" }).trim()
);

export const productImageSchema = z
  .file({ error: "Each product image must be a valid file" })
  .mime(ACCEPTED_PRODUCT_IMAGE_TYPES, {
    error: "Only JPG, JPEG, PNG, and WebP images are allowed",
  })
  .max(MAX_PRODUCT_IMAGE_SIZE, {
    error: "Each image must not exceed 5 MB",
  });

const createImagesSchema = z.preprocess(
  normalizeFileSelection,
  z
    .array(productImageSchema, { error: "Product images are required" })
    .min(1, "At least one product image is required")
    .max(MAX_PRODUCT_IMAGES, "You can upload up to 5 product images")
);

const updateImagesSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return normalizeFileSelection(value);
  },
  z
    .array(productImageSchema, { error: "Product images must be valid files" })
    .min(1, "Select at least one image for a replacement set")
    .max(MAX_PRODUCT_IMAGES, "You can upload up to 5 product images")
    .optional()
);

function validateOriginalPrice(values, context) {
  if (
    values.originalPrice !== undefined &&
    values.originalPrice < values.price
  ) {
    context.addIssue({
      code: "custom",
      path: ["originalPrice"],
      message: "Original price must be greater than or equal to price",
    });
  }
}

export const createProductSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    price: priceSchema,
    originalPrice: originalPriceSchema,
    stock: createStockSchema,
    categoryId: categoryIdSchema,
    subcategoryId: subcategoryIdSchema,
    tags: tagsSchema,
    images: createImagesSchema,
  })
  .superRefine(validateOriginalPrice);

export const updateProductSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    price: priceSchema,
    originalPrice: originalPriceSchema,
    stock: updateStockSchema,
    categoryId: categoryIdSchema,
    subcategoryId: subcategoryIdSchema,
    tags: tagsSchema,
    images: updateImagesSchema,
  })
  .superRefine(validateOriginalPrice);

export const rejectProductSchema = z.object({
  rejectedReason: z
    .string({ error: "Rejection reason is required" })
    .trim()
    .min(1, "Rejection reason is required"),
});
