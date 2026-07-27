import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router";
import { selectIsInitializing } from "./features/auth/authSlice.js";
import LoginPage from "./pages/auth/LoginPage.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";

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
        <Route path="/admin/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default App;
