import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router";
import {
  logoutAdminThunk,
  selectCurrentAdmin,
  selectIsLoggingOut,
} from "../features/auth/authSlice.js";
import { hasAdminPermission } from "../utils/hasAdminPermission.js";
import { ADMIN_NAV_ITEMS } from "../constants/adminNavigation.js";

function AdminLayout() {
  const dispatch = useDispatch();

  const currentAdmin = useSelector(selectCurrentAdmin);
  const isLoggingOut = useSelector(selectIsLoggingOut);

  function handleLogout() {
    dispatch(logoutAdminThunk());
  }

  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) => {
    return (
      item.permission === null ||
      hasAdminPermission(currentAdmin, item.permission)
    );
  });

  return (
    <div>
      <header>
        <span>{currentAdmin?.name || currentAdmin?.email}</span>

        <nav>
          {visibleNavItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
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
