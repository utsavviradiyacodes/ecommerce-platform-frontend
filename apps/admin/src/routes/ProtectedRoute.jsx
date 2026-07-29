import { Navigate, Outlet } from "react-router";
import { selectIsAdminAuthenticated } from "../features/auth/authSlice";
import { useSelector } from "react-redux";

function ProtectedRoute() {
  const isAdminAuthenticated = useSelector(selectIsAdminAuthenticated);

  return isAdminAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/admin/sign-in" replace />
  );
}

export default ProtectedRoute;
