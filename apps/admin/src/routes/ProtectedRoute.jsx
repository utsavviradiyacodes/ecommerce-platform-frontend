import { Navigate, Outlet } from "react-router";
import { selectIsAuthenticated } from "../features/auth/authSlice";
import { useSelector } from "react-redux";

function ProtectedRoute() {
  const IsAuthenticated = useSelector(selectIsAuthenticated);

  return IsAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export default ProtectedRoute;
