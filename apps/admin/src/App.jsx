import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router";

import { selectIsInitializing } from "./features/auth/authSlice.js";

import AdminLayout from "./layouts/AdminLayout.jsx";

import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import ProductsPage from "./pages/products/ProductsPage.jsx";
import SellersPage from "./pages/sellers/SellersPage.jsx";
import OrdersPage from "./pages/orders/OrdersPage.jsx";
import CustomersPage from "./pages/customers/CustomersPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import ReturnsPage from "./pages/returns/ReturnsPage.jsx";
import AdminsPage from "./pages/admins/AdminsPage.jsx";
import CategoriesPage from "./pages/categories/CategoriesPage.jsx";
import SubcategoriesPage from "./pages/subcategories/SubcategoriesPage.jsx";
import UnauthorizedPage from "./pages/errors/UnauthorizedPage.jsx";

import { ADMIN_PERMISSIONS } from "./constants/adminPermissions.js";

import PermissionRoute from "./routes/PermissionRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";

import { SidebarProvider } from "./context/SidebarProvider.jsx";
import SuperAdminRoute from "./routes/SuperAdminRoute.jsx";

function App() {
  const isInitializing = useSelector(selectIsInitializing);

  if (isInitializing) {
    return <p>Checking admin session...</p>;
  }

  return (
    <Routes>
      {/* Public-only routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/admin/login" element={<LoginPage />} />
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

          {/* All routes below require an authenticated Super-admin */}
          <Route element={<SuperAdminRoute />}>
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="admins" element={<AdminsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
