import {
  BoxCubeIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
} from "../icons/index.js";
import { ADMIN_PERMISSIONS } from "./adminPermissions.js";

export const ADMIN_NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: GridIcon,
  },

  {
    label: "Catalog",
    icon: BoxCubeIcon,
    subItems: [
      {
        label: "Categories",
        path: "/admin/categories",
        permission: ADMIN_PERMISSIONS.PRODUCTS,
      },
      {
        label: "Subcategories",
        path: "/admin/subcategories",
        permission: ADMIN_PERMISSIONS.PRODUCTS,
      },
      {
        label: "Products",
        path: "/admin/products",
        permission: ADMIN_PERMISSIONS.PRODUCTS,
      },
    ],
  },

  {
    label: "Commerce",
    icon: DollarLineIcon,
    subItems: [
      {
        label: "Orders",
        path: "/admin/orders",
        permission: ADMIN_PERMISSIONS.ORDERS,
      },
      {
        label: "Returns",
        path: "/admin/returns",
        permission: ADMIN_PERMISSIONS.ORDERS,
      },
      {
        label: "Payments",
        path: "/admin/payments",
      },
    ],
  },

  {
    label: "User Management",
    icon: GroupIcon,
    subItems: [
      {
        label: "Customers",
        path: "/admin/customers",
        permission: ADMIN_PERMISSIONS.CUSTOMERS,
      },
      {
        label: "Sellers",
        path: "/admin/sellers",
        permission: ADMIN_PERMISSIONS.SELLERS,
      },
      {
        label: "Admins",
        path: "/admin/admins",
        superAdminOnly: true,
      },
    ],
  },
];
