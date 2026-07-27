import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { selectIsAuthenticated } from "../features/auth/authSlice";

function PublicOnlyRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return isAuthenticated ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Outlet />
  );
}

export default PublicOnlyRoute;
