import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router";

import { selectIsInitializing } from "./features/auth/authSlice.js";
import AdminLayout from "./layouts/AdminLayout.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";

function App() {
  const isInitializing = useSelector(selectIsInitializing);

  if (isInitializing) {
    return <p>Checking admin session...</p>;
  }

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/admin/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
