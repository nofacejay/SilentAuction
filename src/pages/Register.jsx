import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/* Register page: creates user + stores default bidder role */
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const u = cred.user;

      // Save default role
      await setDoc(doc(db, "users", u.uid), {
        email: u.email,
        role: "bidder"
      });

      navigate("/auction");
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Create account</h2>
        <p className="muted">Join the auction. It takes seconds.</p>

        {error && (
          <div className="spacer-sm" />
        )}
        {error && (
          <div className="card" style={{ background: "#1b1516", borderColor: "#3a1f22" }}>
            <span style={{ color: "#ffb4b4" }}>{error}</span>
          </div>
        )}

        <form className="stack" onSubmit={handleRegister} style={{ marginTop: 12 }}>
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="spacer-sm" />
          <button type="submit" className="btn btnPrimary" style={{ width: "100%" }}>
            Create account
          </button>
        </form>

        <div className="spacer-sm" />
        <p className="muted" style={{ textAlign: "center" }}>
          Already have an account?{" "}
          <Link className="link" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
