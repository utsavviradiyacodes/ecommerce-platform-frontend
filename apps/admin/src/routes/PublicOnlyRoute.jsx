import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { selectIsAdminAuthenticated } from "../features/auth/authSlice";

function PublicOnlyRoute() {
  const isAdminAuthenticated = useSelector(selectIsAdminAuthenticated);

  return isAdminAuthenticated ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Outlet />
  );
}

export default PublicOnlyRoute;
