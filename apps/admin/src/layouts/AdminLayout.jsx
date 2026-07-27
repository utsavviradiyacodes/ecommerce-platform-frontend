import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router";
import {
  logoutAdminThunk,
  selectCurrentAdmin,
  selectIsLoggingOut,
} from "../features/auth/authSlice.js";
import { hasAdminPermission } from "../utils/hasAdminPermission.js";
import { ADMIN_PERMISSIONS } from "../constants/adminPermissions.js";

function AdminLayout() {
  const dispatch = useDispatch();

  const currentAdmin = useSelector(selectCurrentAdmin);
  const isLoggingOut = useSelector(selectIsLoggingOut);

  const canManageProducts = hasAdminPermission(
    currentAdmin,
    ADMIN_PERMISSIONS.PRODUCTS
  );

  const canManageSellers = hasAdminPermission(
    currentAdmin,
    ADMIN_PERMISSIONS.SELLERS
  );

  const canManageOrders = hasAdminPermission(
    currentAdmin,
    ADMIN_PERMISSIONS.ORDERS
  );

  const canManageCustomers = hasAdminPermission(
    currentAdmin,
    ADMIN_PERMISSIONS.CUSTOMERS
  );

  function handleLogout() {
    dispatch(logoutAdminThunk());
  }

  return (
    <div>
      <header>
        <span>{currentAdmin?.name || currentAdmin?.email}</span>

        <nav>
          <NavLink to="/admin/dashboard">Dashboard</NavLink>

          {canManageProducts && (
            <NavLink to="/admin/products">Products</NavLink>
          )}

          {canManageSellers && <NavLink to="/admin/sellers">Sellers</NavLink>}

          {canManageOrders && <NavLink to="/admin/orders">Orders</NavLink>}

          {canManageCustomers && (
            <NavLink to="/admin/customers">Customers</NavLink>
          )}
        </nav>

        <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
