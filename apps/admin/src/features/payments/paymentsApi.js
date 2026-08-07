import axiosInstance from "../../api/axiosInstance.js";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizePaymentId(value) {
  const paymentId = normalizeText(value);

  if (!/^[0-9a-fA-F]{24}$/.test(paymentId)) {
    throw new Error("A valid Payment ID is required.");
  }

  return paymentId;
}

export async function getPayments({
  page = 1,
  limit = 10,
  status = "",
  method = "",
  signal,
} = {}) {
  const params = {
    page: normalizePositiveInteger(page, 1),
    limit: normalizePositiveInteger(limit, 10),
  };
  const normalizedStatus = normalizeText(status).toLowerCase();
  const normalizedMethod = normalizeText(method).toLowerCase();

  if (normalizedStatus) {
    params.status = normalizedStatus;
  }

  if (normalizedMethod) {
    params.method = normalizedMethod;
  }

  const response = await axiosInstance.get("/admin/getAllPayments", {
    params,
    signal,
  });

  return response.data;
}

export async function getPaymentStats({ signal } = {}) {
  const response = await axiosInstance.get("/admin/getPaymentStats", {
    signal,
  });

  return response.data;
}

export async function processPaymentRefund({
  paymentId,
  refundAmount,
  refundReason,
  signal,
}) {
  const normalizedPaymentId = normalizePaymentId(paymentId);
  const normalizedRefundAmount = Number(refundAmount);
  const normalizedRefundReason = normalizeText(refundReason);

  if (!Number.isFinite(normalizedRefundAmount) || normalizedRefundAmount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  if (!normalizedRefundReason) {
    throw new Error("Refund reason is required.");
  }

  const response = await axiosInstance.post(
    `/admin/processRefund/${encodeURIComponent(normalizedPaymentId)}`,
    {
      refundAmount: normalizedRefundAmount,
      refundReason: normalizedRefundReason,
    },
    { signal }
  );

  return response.data;
}
