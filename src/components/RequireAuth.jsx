import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";

/**
 * Guards child routes so only authenticated users can access.
 * Redirects unauthenticated users to /login and preserves the intended URL.
 */
export default function RequireAuth({ children }) {
  // Stores the current user from Firebase Auth
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out, object = signed in
  const location = useLocation();

  // Subscribes to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Shows a minimal loading state while checking auth status
  if (user === undefined) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          Checking authentication…
        </div>
      </div>
    );
  }

  // Redirects to /login if not authenticated; preserves target for post-login redirect
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Renders protected content for authenticated users
  return children;
}
