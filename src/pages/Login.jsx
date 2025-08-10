import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/* Login page: signs user in and routes based on role */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/auction";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const u = cred.user;
      const snap = await getDoc(doc(db, "users", u.uid));
      const role = snap.exists() ? snap.data().role : "bidder";
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Sign in</h2>
        <p className="muted">Welcome back. Enter your credentials.</p>

        {error && (
          <div className="spacer-sm" />
        )}
        {error && (
          <div className="card" style={{ background: "#1b1516", borderColor: "#3a1f22" }}>
            <span style={{ color: "#ffb4b4" }}>{error}</span>
          </div>
        )}

        <form className="stack" onSubmit={handleLogin} style={{ marginTop: 12 }}>
          <div className="stack">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="stack">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="spacer-sm" />
          <button type="submit" className="btn btnPrimary" style={{ width: "100%" }}>
            Sign in
          </button>
        </form>

        <div className="spacer-sm" />
        <p className="muted" style={{ textAlign: "center" }}>
          No account?{" "}
          <Link className="link" to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
