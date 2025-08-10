import { Link } from "react-router-dom";

/* Home: minimal hero with primary actions */
export default function Home() {
  return (
    <div className="container">
      <div className="card stack" style={{ textAlign: "center" }}>
        <h1>Silent Auction</h1>
        <p className="muted">
          Minimal design. Real-time bids. Close, declare, and win.
        </p>

        <div className="spacer-sm" />

        <div className="row rowCenter" style={{ flexWrap: "wrap", gap: 12 }}>
          <Link to="/register"><button className="btn btnPrimary">Create account</button></Link>
          <Link to="/login"><button className="btn btnGhost">Sign in</button></Link>
          <Link to="/auction"><button className="btn btnGhost">View auction</button></Link>
          <Link to="/admin"><button className="btn btnGhost">Admin</button></Link>
        </div>

        <div className="spacer-sm" />
        <p className="muted" style={{ fontSize: ".9rem" }}>
          Tip: bids increase by at least <strong>$1</strong>. Admin can close and declare winners.
        </p>
      </div>
    </div>
  );
}
