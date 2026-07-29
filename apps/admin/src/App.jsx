import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router";

import { selectIsAdminSessionInitializationPending } from "./features/auth/authSlice.js";

import AdminLayout from "./layouts/AdminLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";

import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import CategoriesPage from "./pages/categories/CategoriesPage.jsx";
import SubcategoriesPage from "./pages/subcategories/SubcategoriesPage.jsx";
import ProductsPage from "./pages/products/ProductsPage.jsx";
import OrdersPage from "./pages/orders/OrdersPage.jsx";
import ReturnsPage from "./pages/returns/ReturnsPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import CustomersPage from "./pages/customers/CustomersPage.jsx";
import SellersPage from "./pages/sellers/SellersPage.jsx";
import AdminsPage from "./pages/admins/AdminsPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";
import SignInPage from "./pages/auth/SignInPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import CreateNewPasswordPage from "./pages/auth/CreateNewPasswordPage.jsx";
import VerifyResetCodePage from "./pages/auth/VerifyResetCodePage.jsx";
import NotFoundPage from "./pages/errors/NotFoundPage.jsx";
import UnauthorizedPage from "./pages/errors/UnauthorizedPage.jsx";

import { ADMIN_PERMISSIONS } from "./constants/adminPermissions.js";

import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PermissionRoute from "./routes/PermissionRoute.jsx";
import SuperAdminRoute from "./routes/SuperAdminRoute.jsx";

import { SidebarProvider } from "./context/SidebarProvider.jsx";

function App() {
  const isAdminSessionInitializationPending = useSelector(
    selectIsAdminSessionInitializationPending
  );

  if (isAdminSessionInitializationPending) {
    return <p>Checking admin session...</p>;
  }

  return (
    <Routes>
      {/* Public-only authentication routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/admin/sign-in" element={<SignInPage />} />

          <Route
            path="/admin/forgot-password"
            element={<ForgotPasswordPage />}
          />

          <Route
            path="/admin/verify-reset-code"
            element={<VerifyResetCodePage />}
          />

          <Route
            path="/admin/create-new-password"
            element={<CreateNewPasswordPage />}
          />
        </Route>
      </Route>

      {/* All routes below require an authenticated admin */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/admin"
          element={
            <SidebarProvider>
              <AdminLayout />
            </SidebarProvider>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Any authenticated admin can access these */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />

          {/* Only admins with manageProducts can access this */}
          <Route
            element={
              <PermissionRoute
                requiredPermission={ADMIN_PERMISSIONS.PRODUCTS}
              />
            }
          >
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="subcategories" element={<SubcategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
          </Route>

          {/* Only admins with manageSellers can access this */}
          <Route
            element={
              <PermissionRoute requiredPermission={ADMIN_PERMISSIONS.SELLERS} />
            }
          >
            <Route path="sellers" element={<SellersPage />} />
          </Route>

          {/* Only admins with manageOrders can access this */}
          <Route
            element={
              <PermissionRoute requiredPermission={ADMIN_PERMISSIONS.ORDERS} />
            }
          >
            <Route path="orders" element={<OrdersPage />} />
            <Route path="returns" element={<ReturnsPage />} />
          </Route>

          {/* Only admins with manageCustomers can access this */}
          <Route
            element={
              <PermissionRoute
                requiredPermission={ADMIN_PERMISSIONS.CUSTOMERS}
              />
            }
          >
            <Route path="customers" element={<CustomersPage />} />
          </Route>

          {/* Only authenticated Super-admins can access Admins */}
          <Route element={<SuperAdminRoute />}>
            <Route path="admins" element={<AdminsPage />} />
          </Route>

          {/* Unknown admin routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Redirect the root URL to the admin area */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
