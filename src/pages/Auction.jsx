import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import BidHistory from "../components/BidHistory";
import "../styles/auction.css";

export default function Auction() {
  // Stores auction items from Firestore
  const [items, setItems] = useState([]);
  // Stores bid amounts keyed by item ID
  const [bidByItem, setBidByItem] = useState({});
  // Stores the current authenticated user
  const [user, setUser] = useState(null);
  // Stores error messages for user feedback
  const [error, setError] = useState("");
  // Controls per-item bid history visibility
  const [historyOpen, setHistoryOpen] = useState({});
  // Search text for client-side filter
  const [queryText, setQueryText] = useState("");

  // Subscribes to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Subscribes to live updates for items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sorts newest first
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setItems(data);
    });
    return () => unsub();
  }, []);

  // Client-side filter: matches title/description
  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const t = (it.title || "").toLowerCase();
      const d = (it.description || "").toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [items, queryText]);

  // Handles bid submission for an item
  const handleBid = async (item) => {
    setError("");

    // Prevents bidding on closed items
    if (item.isClosed) {
      setError("Bidding is closed for this item.");
      return;
    }

    // Requires authentication
    if (!user) {
      setError("Please log in to place a bid.");
      return;
    }

    // Reads and validates amount
    const raw = bidByItem[item.id];
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid bid amount.");
      return;
    }

    // Enforces $1 increment above current top
    const currentTop = Number(item.topBidAmount || 0);
    const minRequired = currentTop + 1;
    if (amount < minRequired) {
      setError(
        `Bid must be at least $${minRequired.toFixed(
          2
        )} (current top is $${currentTop.toFixed(2)}).`
      );
      return;
    }

    try {
      // Writes a bid record
      await addDoc(collection(db, "items", item.id, "bids"), {
        userId: user.uid,
        userEmail: user.email || "(no email)",
        amount,
        createdAt: serverTimestamp(),
      });

      // Updates current leaderboard fields
      await updateDoc(doc(db, "items", item.id), {
        topBidAmount: amount,
        topBidUserId: user.uid,
        topBidUserEmail: user.email || "(no email)",
        updatedAt: serverTimestamp(),
      });

      // Clears the input for that item
      setBidByItem((m) => ({ ...m, [item.id]: "" }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page">
      {/* Header with accent and subtitle */}
      <div className="pageHeader">
        <div className="titleRow">
          <span className="accentDot" />
          <h2 className="pageTitle">Active Auction Items</h2>
        </div>
        <p className="pageSubtitle">Search, browse, and bid in real time.</p>
      </div>

      {/* Search bar */}
      <div className="filterBar">
        <input
          className="searchInput"
          type="text"
          placeholder="Search items by title or description…"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
        {queryText && (
          <button
            className="btn btnGhost"
            onClick={() => setQueryText("")}
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="errorText">{error}</p>}

      {!items.length && (
        <p className="emptyText">No items yet. Check back soon.</p>
      )}

      {!!items.length && !filtered.length && (
        <p className="emptyText">No items match that search.</p>
      )}

      <div className="itemsGrid">
        {filtered.map((item) => (
          <div key={item.id} className="itemCard">
            <div className="itemMedia">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="itemImage"
                />
              )}
            </div>

            <div className="itemBody">
              <h3 className="itemTitle">{item.title}</h3>
              <p className="itemDesc">{item.description}</p>

              <p className="topBid">
                Top bid: ${Number(item.topBidAmount || 0).toFixed(2)}{" "}
                {item.topBidUserEmail ? `(by ${item.topBidUserEmail})` : ""}
              </p>

              <p style={{ margin: "4px 0 8px 0" }}>
                <span className={`badge ${item.isClosed ? "badgeClosed" : "badgeOpen"}`}>
                  {item.isClosed ? "Closed" : "Open"}
                </span>
              </p>

              <div className="bidRow">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="bidInput"
                  placeholder={
                    item.isClosed
                      ? "Bidding closed"
                      : `Enter at least $${(Number(item.topBidAmount || 0) + 1).toFixed(2)}`
                  }
                  value={bidByItem[item.id] ?? ""}
                  onChange={(e) =>
                    setBidByItem((m) => ({ ...m, [item.id]: e.target.value }))
                  }
                  disabled={item.isClosed}
                />
                <button
                  className="btn btnPrimary bidButton"
                  onClick={() => handleBid(item)}
                  disabled={item.isClosed}
                >
                  Place Bid
                </button>
              </div>

              {/* Only show history to signed-in users if your rules require isSignedIn() */}
              {user && (
                <div className="historyToggleRow">
                  <button
                    className="btn btnGhost"
                    onClick={() =>
                      setHistoryOpen((m) => ({ ...m, [item.id]: !m[item.id] }))
                    }
                  >
                    {historyOpen[item.id] ? "Hide bid history" : "Show bid history"}
                  </button>
                </div>
              )}

              {user && <BidHistory itemId={item.id} open={!!historyOpen[item.id]} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
