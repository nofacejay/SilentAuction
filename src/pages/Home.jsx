import { Link } from "react-router-dom";

export default function Home() {
  console.log("✅ Home.jsx rendered");

  return (
    <div>
      <h1>Welcome to the Silent Auction</h1>
      <nav>
        <Link to="/register">Register</Link> |{" "}
        <Link to="/login">Login</Link> |{" "}
        <Link to="/auction">Auction</Link> |{" "}
        <Link to="/admin">Admin</Link>
      </nav>
    </div>
  );
}
