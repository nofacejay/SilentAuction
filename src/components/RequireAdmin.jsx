import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";

/**
 * Guards child routes so only users with role "admin" can access.
 * Redirects non-admins to /auction and unauthenticated users to /login.
 */
export default function RequireAdmin({ children }) {
  // Stores role check states: user loading, role loading, role value
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading, null = signed out, object = signed in
  const [role, setRole] = useState(undefined); // undefined = loading, "admin" | other
  const location = useLocation();

  // Subscribes to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUser(u));
    return () => unsub();
  }, []);

  // Fetches role from Firestore when user is available
  useEffect(() => {
    const loadRole = async () => {
      if (!authUser) {
        setRole(undefined);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", authUser.uid));
        setRole(snap.exists() ? snap.data().role : null);
      } catch {
        setRole(null);
      }
    };
    if (authUser) loadRole();
  }, [authUser]);

  // Shows a minimal loading state while checking auth/role
  if (authUser === undefined || (authUser && role === undefined)) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          Checking admin access…
        </div>
      </div>
    );
  }

  // If not signed in, go to /login
  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If signed in but not admin, redirect to bidder area
  if (role !== "admin") {
    return <Navigate to="/auction" replace />;
  }

  // Admin content
  return children;
}
