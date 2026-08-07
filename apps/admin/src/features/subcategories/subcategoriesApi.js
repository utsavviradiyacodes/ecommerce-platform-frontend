import axiosInstance from "../../api/axiosInstance.js";

const INVALID_SUBCATEGORIES_RESPONSE_MESSAGE =
  "Received an unexpected Subcategory list response.";

function isNonArrayObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUsableText(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function isNonNegativeInteger(value) {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function hasUsableParentCategory(subcategory) {
  const category = subcategory.category ?? subcategory.categoryId;

  if (isUsableText(category)) {
    return true;
  }

  return (
    isNonArrayObject(category) &&
    isUsableText(category._id ?? category.id)
  );
}

function validateSubcategoriesResponse(responseData) {
  if (
    responseData?.success !== true ||
    !Array.isArray(responseData.data) ||
    !isNonNegativeInteger(responseData.total) ||
    !responseData.data.every(
      (subcategory) =>
        isNonArrayObject(subcategory) &&
        isUsableText(subcategory._id) &&
        isUsableText(subcategory.name) &&
        hasUsableParentCategory(subcategory)
    )
  ) {
    throw new Error(INVALID_SUBCATEGORIES_RESPONSE_MESSAGE);
  }

  return responseData;
}

export async function getAllSubcategories() {
  const response = await axiosInstance.get("/subcategory/getAllSubcategories");

  return validateSubcategoriesResponse(response.data);
}

export async function addSubcategory({ name, categoryId, image }) {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("categoryId", categoryId);

  if (image) {
    formData.append("image", image);
  }

  const response = await axiosInstance.post(
    "/subcategory/addSubcategory",
    formData
  );

  return response.data;
}

export async function updateSubcategory({
  subcategoryId,
  name,
  categoryId,
  image,
}) {
  const formData = new FormData();

  if (name !== undefined) {
    formData.append("name", name);
  }

  if (categoryId !== undefined) {
    formData.append("categoryId", categoryId);
  }

  if (image) {
    formData.append("image", image);
  }

  const response = await axiosInstance.post(
    `/subcategory/updateSubcategory/${subcategoryId}`,
    formData
  );

  return response.data;
}

export async function deleteSubcategory(subcategoryId) {
  const response = await axiosInstance.delete(
    `/subcategory/deleteSubcategory/${subcategoryId}`
  );

  return response.data;
}
