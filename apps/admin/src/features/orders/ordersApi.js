import axiosInstance from "../../api/axiosInstance.js";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeOrderId(value) {
  const orderId = normalizeText(value);

  if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
    throw new Error("A valid Order ID is required.");
  }

  return orderId;
}

export async function getOrders({
  page = 1,
  limit = 10,
  orderStatus = "",
  paymentStatus = "",
  paymentMethod = "",
  signal,
} = {}) {
  const params = {
    page: normalizePositiveInteger(page, 1),
    limit: normalizePositiveInteger(limit, 10),
  };
  const normalizedOrderStatus = normalizeText(orderStatus).toLowerCase();
  const normalizedPaymentStatus = normalizeText(paymentStatus).toLowerCase();
  const normalizedPaymentMethod = normalizeText(paymentMethod).toLowerCase();

  if (normalizedOrderStatus) {
    params.orderStatus = normalizedOrderStatus;
  }

  if (normalizedPaymentStatus) {
    params.paymentStatus = normalizedPaymentStatus;
  }

  if (normalizedPaymentMethod) {
    params.paymentMethod = normalizedPaymentMethod;
  }

  const response = await axiosInstance.get("/admin/getAllOrders", {
    params,
    signal,
  });

  return response.data;
}

export async function getOrderStats({ signal } = {}) {
  const response = await axiosInstance.get("/admin/getOrderStats", {
    signal,
  });

  return response.data;
}

export async function getOrderDetails(orderId, { signal } = {}) {
  const normalizedOrderId = normalizeOrderId(orderId);
  const response = await axiosInstance.get(
    `/order/getOrderById/${encodeURIComponent(normalizedOrderId)}`,
    { signal }
  );

  return response.data;
}
