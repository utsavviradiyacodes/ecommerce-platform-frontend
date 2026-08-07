const INVALID_ADMIN_DATA_MESSAGE =
  "Received an unexpected administrator response.";

const AUTHENTICATED_ADMIN_ROLES = new Set(["admin", "superadmin"]);

function isNonArrayObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function normalizeAdminPermissions(value) {
  const permissions = isNonArrayObject(value) ? value : {};

  return {
    manageProducts: permissions.manageProducts === true,
    manageSellers: permissions.manageSellers === true,
    manageOrders: permissions.manageOrders === true,
    manageCustomers: permissions.manageCustomers === true,
  };
}

export function normalizeAdminData(value) {
  if (!isNonArrayObject(value)) {
    throw new Error(INVALID_ADMIN_DATA_MESSAGE);
  }

  const normalizedAdmin = {
    _id: toTrimmedString(value._id ?? value.id),
    name: toTrimmedString(value.name),
    email: toTrimmedString(value.email),
    phone: toTrimmedString(value.phone),
    avatar: toTrimmedString(value.avatar),
    role: toTrimmedString(value.role) || "admin",
    isSuperAdmin: value.isSuperAdmin === true,
    permissions: normalizeAdminPermissions(value.permissions),
    isActive: toOptionalBoolean(value.isActive),
    isVerified: toOptionalBoolean(value.isVerified),
    createdAt: toTrimmedString(value.createdAt) || null,
    updatedAt: toTrimmedString(value.updatedAt) || null,
  };

  if (!normalizedAdmin._id || !normalizedAdmin.name || !normalizedAdmin.email) {
    throw new Error(INVALID_ADMIN_DATA_MESSAGE);
  }

  return normalizedAdmin;
}

export function normalizeAuthenticatedAdminData(value) {
  if (!isNonArrayObject(value)) {
    throw new Error(INVALID_ADMIN_DATA_MESSAGE);
  }

  const role = toTrimmedString(value.role);
  const hasInvalidActiveStatus =
    Object.hasOwn(value, "isActive") && value.isActive !== true;
  const hasInvalidVerificationStatus =
    Object.hasOwn(value, "isVerified") && value.isVerified !== true;
  const hasInvalidSuperAdminStatus =
    Object.hasOwn(value, "isSuperAdmin") &&
    typeof value.isSuperAdmin !== "boolean";

  if (
    !AUTHENTICATED_ADMIN_ROLES.has(role) ||
    hasInvalidActiveStatus ||
    hasInvalidVerificationStatus ||
    hasInvalidSuperAdminStatus
  ) {
    throw new Error(INVALID_ADMIN_DATA_MESSAGE);
  }

  return normalizeAdminData(value);
}

export function normalizeAdminAuthenticationData(value) {
  if (!isNonArrayObject(value)) {
    throw new Error(INVALID_ADMIN_DATA_MESSAGE);
  }

  const token = toTrimmedString(value.token);

  if (!token) {
    throw new Error(INVALID_ADMIN_DATA_MESSAGE);
  }

  return {
    token,
    admin: normalizeAuthenticatedAdminData(value),
  };
}
