import { ADMIN_PERMISSIONS } from "./adminPermissions.js";

export const ADMIN_NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    permission: null,
  },
  {
    label: "Products",
    to: "/admin/products",
    permission: ADMIN_PERMISSIONS.PRODUCTS,
  },
  {
    label: "Sellers",
    to: "/admin/sellers",
    permission: ADMIN_PERMISSIONS.SELLERS,
  },
  {
    label: "Orders",
    to: "/admin/orders",
    permission: ADMIN_PERMISSIONS.ORDERS,
  },
  {
    label: "Customers",
    to: "/admin/customers",
    permission: ADMIN_PERMISSIONS.CUSTOMERS,
  },
];
