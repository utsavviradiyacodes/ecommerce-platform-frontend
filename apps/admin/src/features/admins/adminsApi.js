import axiosInstance from "../../api/axiosInstance.js";

export const ADMIN_PERMISSION_KEYS = [
  "manageProducts",
  "manageSellers",
  "manageOrders",
  "manageCustomers",
];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeAdminId(value) {
  const adminId = normalizeText(value);

  if (!/^[0-9a-fA-F]{24}$/.test(adminId)) {
    throw new Error("A valid Admin ID is required.");
  }

  return adminId;
}

function normalizePermissionPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Admin permissions are required.");
  }

  return Object.entries(value).reduce((permissions, [key, permissionValue]) => {
    const normalizedKey = normalizeText(key);

    if (normalizedKey && typeof permissionValue === "boolean") {
      permissions[normalizedKey] = permissionValue;
    }

    return permissions;
  }, {});
}

export async function getAdmins({
  page = 1,
  limit = 10,
  search = "",
  signal,
} = {}) {
  const params = {
    page: normalizePositiveInteger(page, 1),
    limit: normalizePositiveInteger(limit, 10),
  };
  const normalizedSearch = normalizeText(search);

  if (normalizedSearch) {
    params.search = normalizedSearch;
  }

  const response = await axiosInstance.get("/admin/admins", {
    params,
    signal,
  });

  return response.data;
}

export async function createAdminAccount({
  name,
  email,
  phone,
  password,
  confirmPassword,
  isSuperAdmin = false,
  permissions,
  signal,
} = {}) {
  const body = {
    name: normalizeText(name),
    email: normalizeText(email).toLowerCase(),
    phone: normalizeText(phone),
    password,
    confirmPassword,
    isSuperAdmin: isSuperAdmin === true,
  };

  if (!body.isSuperAdmin && permissions !== undefined) {
    body.permissions = normalizePermissionPayload(permissions);
  }

  const response = await axiosInstance.post("/admin/admins/add", body, {
    signal,
  });

  return {
    message:
      typeof response.data?.message === "string"
        ? response.data.message.trim() || null
        : null,
  };
}

export async function updateAdminAccount({
  adminId,
  changes,
  signal,
} = {}) {
  const normalizedAdminId = normalizeAdminId(adminId);
  const body = {};

  if (Object.hasOwn(changes ?? {}, "name")) {
    body.name = normalizeText(changes.name);
  }

  if (Object.hasOwn(changes ?? {}, "phone")) {
    body.phone = normalizeText(changes.phone);
  }

  if (typeof changes?.isSuperAdmin === "boolean") {
    body.isSuperAdmin = changes.isSuperAdmin;
  }

  if (Object.hasOwn(changes ?? {}, "permissions")) {
    body.permissions = normalizePermissionPayload(changes.permissions);
  }

  if (Object.keys(body).length === 0) {
    throw new Error("At least one supported Admin change is required.");
  }

  const response = await axiosInstance.post(
    `/admin/admins/update/${encodeURIComponent(normalizedAdminId)}`,
    body,
    { signal }
  );

  return response.data;
}

export async function deleteAdminAccount(adminId, { signal } = {}) {
  const normalizedAdminId = normalizeAdminId(adminId);
  const response = await axiosInstance.delete(
    `/admin/admins/${encodeURIComponent(normalizedAdminId)}`,
    { signal }
  );

  return response.data;
}
