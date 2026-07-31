import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import { selectIsAdminAuthenticated } from "../features/auth/authSlice";
import {
  ADMIN_DEFAULT_SIGN_IN_DESTINATION,
  getSafeAdminSignInReturnDestination,
} from "../utils/routing/adminSignInReturnDestination.js";

function PublicOnlyRoute() {
  const location = useLocation();
  const isAdminAuthenticated = useSelector(selectIsAdminAuthenticated);

  const returnDestination =
    location.pathname === "/admin/sign-in"
      ? getSafeAdminSignInReturnDestination(location.state)
      : null;

  return isAdminAuthenticated ? (
    <Navigate
      to={returnDestination || ADMIN_DEFAULT_SIGN_IN_DESTINATION}
      replace
    />
  ) : (
    <Outlet />
  );
}

export default PublicOnlyRoute;
