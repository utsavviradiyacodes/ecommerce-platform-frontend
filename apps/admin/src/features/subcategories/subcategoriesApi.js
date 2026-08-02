import axiosInstance from "../../api/axiosInstance.js";

export async function getAllSubcategories() {
  const response = await axiosInstance.get("/subcategory/getAllSubcategories");

  return response.data;
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
