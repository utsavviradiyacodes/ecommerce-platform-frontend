import axiosInstance from "../../api/axiosInstance.js";

function hasQueryValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function buildSellersListParams({
  page = 1,
  limit = 10,
  search = "",
  isApproved,
  isActive,
} = {}) {
  const params = { page, limit };
  const normalizedSearch = typeof search === "string" ? search.trim() : "";

  if (normalizedSearch) {
    params.search = normalizedSearch;
  }

  if (hasQueryValue(isApproved)) {
    params.isApproved = isApproved;
  }

  if (hasQueryValue(isActive)) {
    params.isActive = isActive;
  }

  return params;
}

export async function getSellers(options = {}) {
  const response = await axiosInstance.get("/admin/getAllSellers", {
    params: buildSellersListParams(options),
  });

  return response.data;
}

export async function getSellerDetails(sellerId) {
  const response = await axiosInstance.get(`/admin/getSellerById/${sellerId}`);

  return response.data;
}

export async function approveSeller(sellerId) {
  const response = await axiosInstance.post(
    `/admin/approveSeller/${sellerId}`,
    null
  );

  return response.data;
}

export async function revokeSellerApproval(sellerId) {
  const response = await axiosInstance.post(
    `/admin/rejectSeller/${sellerId}`,
    null
  );

  return response.data;
}

export async function activateSeller(sellerId) {
  const response = await axiosInstance.post(
    `/admin/activateUser/${sellerId}`,
    null,
    {
      params: { role: "seller" },
    }
  );

  return response.data;
}

export async function deactivateSeller(sellerId) {
  const response = await axiosInstance.post(
    `/admin/deactivateUser/${sellerId}`,
    null,
    {
      params: { role: "seller" },
    }
  );

  return response.data;
}
