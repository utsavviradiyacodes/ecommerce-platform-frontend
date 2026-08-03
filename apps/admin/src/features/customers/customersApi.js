import axiosInstance from "../../api/axiosInstance.js";

function hasQueryValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function buildCustomersListParams({
  page = 1,
  limit = 10,
  search = "",
  isActive,
} = {}) {
  const params = { page, limit };
  const normalizedSearch = typeof search === "string" ? search.trim() : "";

  if (normalizedSearch) {
    params.search = normalizedSearch;
  }

  if (hasQueryValue(isActive)) {
    params.isActive = isActive;
  }

  return params;
}

export async function getCustomers(options = {}) {
  const response = await axiosInstance.get("/admin/getAllCustomers", {
    params: buildCustomersListParams(options),
  });

  return response.data;
}

export async function activateCustomer(customerId) {
  const response = await axiosInstance.post(
    `/admin/activateUser/${customerId}`,
    null,
    {
      params: { role: "customer" },
    }
  );

  return response.data;
}

export async function deactivateCustomer(customerId) {
  const response = await axiosInstance.post(
    `/admin/deactivateUser/${customerId}`,
    null,
    {
      params: { role: "customer" },
    }
  );

  return response.data;
}
