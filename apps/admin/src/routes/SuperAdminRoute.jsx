import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";

import { selectCurrentAdmin } from "../features/auth/authSlice.js";

function SuperAdminRoute() {
  const currentAdmin = useSelector(selectCurrentAdmin);

  return currentAdmin?.isSuperAdmin === true ? (
    <Outlet />
  ) : (
    <Navigate to="/admin/unauthorized" replace />
  );
}

export default SuperAdminRoute;
