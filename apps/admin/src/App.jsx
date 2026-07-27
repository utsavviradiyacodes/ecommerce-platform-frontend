import { Navigate, Route, Routes } from "react-router";
import LoginPage from "./pages/auth/LoginPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default App;
