import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router";
import {
  logoutAdminThunk,
  selectCurrentAdmin,
  selectIsLoggingOut,
} from "../features/auth/authSlice.js";

function AdminLayout() {
  const dispatch = useDispatch();

  const currentAdmin = useSelector(selectCurrentAdmin);
  const isLoggingOut = useSelector(selectIsLoggingOut);

  function handleLogout() {
    dispatch(logoutAdminThunk());
  }

  return (
    <div>
      <header>
        <span>{currentAdmin?.name || currentAdmin?.email}</span>

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
