import axiosInstance from "../../api/axiosInstance.js";

const RETURN_STATUSES = new Set([
  "requested",
  "approved",
  "rejected",
  "refunded",
]);

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeReturnId(value) {
  const returnId = normalizeText(value);

  if (!/^[0-9a-fA-F]{24}$/.test(returnId)) {
    throw new Error("A valid Return ID is required.");
  }

  return returnId;
}

export async function getReturns({
  page = 1,
  limit = 10,
  status = "",
  signal,
} = {}) {
  const params = {
    page: normalizePositiveInteger(page, 1),
    limit: normalizePositiveInteger(limit, 10),
  };
  const normalizedStatus = normalizeText(status).toLowerCase();

  if (RETURN_STATUSES.has(normalizedStatus)) {
    params.status = normalizedStatus;
  }

  const response = await axiosInstance.get("/admin/getAllReturns", {
    params,
    signal,
  });

  return response.data;
}

export async function getReturnStats({ signal } = {}) {
  const response = await axiosInstance.get("/admin/getReturnStats", {
    signal,
  });

  return response.data;
}

export async function getReturnDetails(returnId, { signal } = {}) {
  const normalizedReturnId = normalizeReturnId(returnId);
  const response = await axiosInstance.get(
    `/return/getReturnById/${encodeURIComponent(normalizedReturnId)}`,
    { signal }
  );

  return response.data;
}

export async function approveReturn({ returnId, refundNote, signal }) {
  const normalizedReturnId = normalizeReturnId(returnId);
  const normalizedRefundNote = normalizeText(refundNote);
  const body = normalizedRefundNote
    ? { refundNote: normalizedRefundNote }
    : {};
  const response = await axiosInstance.post(
    `/admin/approveReturn/${encodeURIComponent(normalizedReturnId)}`,
    body,
    { signal }
  );

  return response.data;
}

export async function rejectReturn({ returnId, rejectedReason, signal }) {
  const normalizedReturnId = normalizeReturnId(returnId);
  const normalizedRejectedReason = normalizeText(rejectedReason);

  if (!normalizedRejectedReason) {
    throw new Error("Rejection reason is required.");
  }

  const response = await axiosInstance.post(
    `/admin/rejectReturn/${encodeURIComponent(normalizedReturnId)}`,
    { rejectedReason: normalizedRejectedReason },
    { signal }
  );

  return response.data;
}
