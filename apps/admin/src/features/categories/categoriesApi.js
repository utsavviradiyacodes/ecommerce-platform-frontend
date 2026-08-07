import axiosInstance from "../../api/axiosInstance.js";

const INVALID_CATEGORIES_RESPONSE_MESSAGE =
  "Received an unexpected Category list response.";

function isNonArrayObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUsableText(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function isNonNegativeInteger(value) {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function validateCategoriesResponse(responseData) {
  const data = responseData?.data;

  if (
    responseData?.success !== true ||
    !isNonArrayObject(data) ||
    !Array.isArray(data.categories) ||
    !isNonNegativeInteger(data.total) ||
    !data.categories.every(
      (category) =>
        isNonArrayObject(category) &&
        isUsableText(category._id) &&
        isUsableText(category.name)
    )
  ) {
    throw new Error(INVALID_CATEGORIES_RESPONSE_MESSAGE);
  }

  return responseData;
}

export async function getAllCategories() {
  const response = await axiosInstance.get("/category/getAllCategories");

  return validateCategoriesResponse(response.data);
}

export async function addCategory({ name, image }) {
  const formData = new FormData();

  formData.append("name", name);

  if (image) {
    formData.append("image", image);
  }

  const response = await axiosInstance.post("/category/addCategory", formData);

  return response.data;
}

export async function updateCategory({ categoryId, name, image }) {
  const formData = new FormData();

  if (name !== undefined) {
    formData.append("name", name);
  }

  if (image) {
    formData.append("image", image);
  }

  const response = await axiosInstance.post(
    `/category/updateCategory/${categoryId}`,
    formData
  );

  return response.data;
}

export async function deleteCategory(categoryId) {
  const response = await axiosInstance.delete(
    `/category/deleteCategory/${categoryId}`
  );

  return response.data;
}
