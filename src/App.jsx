import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Auction from "./pages/Auction";
import AdminDashboard from "./pages/AdminDashboard";
import Notifications from "./pages/Notifications";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/auction" element={<Auction />} />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />

      <Route
        path="/notifications"
        element={
          <RequireAdmin>
            <Notifications />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}
