import axiosInstance from "../../api/axiosInstance.js";

export async function getDashboardStats() {
  const response = await axiosInstance.get("/admin/getDashboardStats");

  return response.data;
}

export async function getPaymentStats() {
  const response = await axiosInstance.get("/admin/getPaymentStats");

  return response.data;
}

export async function getReturnStats() {
  const response = await axiosInstance.get("/admin/getReturnStats");

  return response.data;
}

export async function getRecentProducts() {
  const response = await axiosInstance.get("/admin/getAllProductsAdmin", {
    params: {
      page: 1,
      limit: 5,
    },
  });

  return response.data;
}
