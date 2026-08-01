import axiosInstance from "../../api/axiosInstance.js";

export async function getAllCategories() {
  const response = await axiosInstance.get("/category/getAllCategories");

  return response.data;
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

  formData.append("name", name);

  if (image) {
    formData.append("image", image);
  }

  const response = await axiosInstance.post(
    `/category/updateCategory/${categoryId}`,
    formData
  );

  return response.data;
}
