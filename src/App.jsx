import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Auction from "./pages/Auction";
import AdminDashboard from "./pages/AdminDashboard";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/auction"
        element={
          <RequireAuth>
            <Auction />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}
