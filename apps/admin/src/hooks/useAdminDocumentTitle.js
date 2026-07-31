import { useEffect } from "react";
import { useLocation } from "react-router";

const ADMIN_APPLICATION_TITLE = "Sellora Admin";

const ADMIN_PAGE_NAME_BY_PATH = new Map([
  ["/", "Dashboard"],
  ["/admin", "Dashboard"],
  ["/admin/sign-in", "Sign In"],
  ["/admin/forgot-password", "Forgot Password"],
  ["/admin/verify-reset-code", "Verify Reset Code"],
  ["/admin/create-new-password", "Create New Password"],
  ["/admin/dashboard", "Dashboard"],
  ["/admin/categories", "Categories"],
  ["/admin/subcategories", "Subcategories"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/returns", "Returns"],
  ["/admin/payments", "Payments"],
  ["/admin/customers", "Customers"],
  ["/admin/sellers", "Sellers"],
  ["/admin/admins", "Admins"],
  ["/admin/profile", "Profile"],
  ["/admin/settings", "Settings"],
  ["/admin/unauthorized", "Unauthorized"],
]);

function normalizePathname(pathname) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "").toLowerCase();
}

function createAdminDocumentTitle(pageName) {
  return `${pageName} | ${ADMIN_APPLICATION_TITLE}`;
}

export function useAdminDocumentTitle({
  isSessionInitializationPending,
  hasSessionInitializationFailed,
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    let pageName =
      ADMIN_PAGE_NAME_BY_PATH.get(normalizePathname(pathname)) ||
      "Page Not Found";

    if (isSessionInitializationPending) {
      pageName = "Checking Session";
    } else if (hasSessionInitializationFailed) {
      pageName = "Unable to Connect";
    }

    document.title = createAdminDocumentTitle(pageName);
  }, [
    hasSessionInitializationFailed,
    isSessionInitializationPending,
    pathname,
  ]);
}
