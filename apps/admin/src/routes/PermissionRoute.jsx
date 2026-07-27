import { useSelector } from "react-redux";
import { selectCurrentAdmin } from "../features/auth/authSlice";
import { hasAdminPermission } from "../utils/hasAdminPermission";
import { Navigate, Outlet } from "react-router";

function PermissionRoute({ requiredPermission }) {
  const currentAdmin = useSelector(selectCurrentAdmin);

  const isPermitted = hasAdminPermission(currentAdmin, requiredPermission);

  return isPermitted ? (
    <Outlet />
  ) : (
    <Navigate to="/admin/unauthorized" replace />
  );
}

export default PermissionRoute;
