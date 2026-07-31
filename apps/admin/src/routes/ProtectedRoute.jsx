import { Navigate, Outlet, useLocation } from "react-router";
import { selectIsAdminAuthenticated } from "../features/auth/authSlice";
import { useSelector } from "react-redux";
import { ADMIN_SIGN_IN_REDIRECT_SOURCE } from "../utils/routing/adminSignInReturnDestination.js";

function ProtectedRoute() {
  const location = useLocation();
  const isAdminAuthenticated = useSelector(selectIsAdminAuthenticated);

  return isAdminAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate
      to="/admin/sign-in"
      replace
      state={{
        source: ADMIN_SIGN_IN_REDIRECT_SOURCE.PROTECTED_ROUTE,
        from: location,
      }}
    />
  );
}

export default ProtectedRoute;
