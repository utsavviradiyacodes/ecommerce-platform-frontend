import axiosInstance from "../../api/axiosInstance.js";

export async function getOrdersDashboardStats({ signal } = {}) {
  const response = await axiosInstance.get("/admin/getDashboardStats", {
    signal,
  });

  return response.data;
}

export async function getOrdersSellerPage({
  page = 1,
  limit = 50,
  signal,
} = {}) {
  const response = await axiosInstance.get("/admin/getAllSellers", {
    params: { page, limit },
    signal,
  });

  return response.data;
}

export async function getSellerOrdersPage(
  sellerId,
  { page = 1, limit = 50, signal } = {}
) {
  const response = await axiosInstance.get(
    `/admin/getOrdersBySeller/${encodeURIComponent(sellerId)}`,
    {
      params: { page, limit },
      signal,
    }
  );

  return response.data;
}

export async function getOrderDetails(orderId, { signal } = {}) {
  const response = await axiosInstance.get(
    `/order/getOrderById/${encodeURIComponent(orderId)}`,
    { signal }
  );

  return response.data;
}
