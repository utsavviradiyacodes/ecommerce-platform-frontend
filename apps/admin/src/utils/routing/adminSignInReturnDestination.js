export const ADMIN_DEFAULT_SIGN_IN_DESTINATION = "/admin/dashboard";

export const ADMIN_SIGN_IN_REDIRECT_SOURCE = {
  PROTECTED_ROUTE: "protectedRoute",
};

const PUBLIC_ADMIN_AUTH_PATHS = new Set([
  "/admin/sign-in",
  "/admin/forgot-password",
  "/admin/verify-reset-code",
  "/admin/create-new-password",
]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function isValidPathname(pathname) {
  if (
    typeof pathname !== "string" ||
    (pathname !== "/admin" && !pathname.startsWith("/admin/")) ||
    pathname.includes("\\") ||
    pathname.includes("?") ||
    pathname.includes("#")
  ) {
    return false;
  }

  const pathSegments = pathname.split("/");

  if (pathSegments.includes(".") || pathSegments.includes("..")) {
    return false;
  }

  const normalizedPathname =
    pathname.length > 1
      ? pathname.replace(/\/+$/, "").toLowerCase()
      : pathname;

  return !PUBLIC_ADMIN_AUTH_PATHS.has(normalizedPathname);
}

function isValidLocationSuffix(value, prefix) {
  return typeof value === "string" && (!value || value.startsWith(prefix));
}

export function getSafeAdminSignInReturnDestination(locationState) {
  if (
    !isPlainObject(locationState) ||
    locationState.source !== ADMIN_SIGN_IN_REDIRECT_SOURCE.PROTECTED_ROUTE ||
    !isPlainObject(locationState.from)
  ) {
    return null;
  }

  const { pathname, search, hash, key } = locationState.from;

  if (
    !isValidPathname(pathname) ||
    !isValidLocationSuffix(search, "?") ||
    !isValidLocationSuffix(hash, "#") ||
    typeof key !== "string" ||
    !key
  ) {
    return null;
  }

  return {
    pathname,
    search,
    hash,
  };
}
