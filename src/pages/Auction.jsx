import { useEffect, useState } from "react";
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
  const [items, setItems] = useState([]);
  const [bidByItem, setBidByItem] = useState({});
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setItems(data);
    });
    return () => unsub();
  }, []);

  const handleBid = async (item) => {
    setError("");
    if (item.isClosed) {
      setError("Bidding is closed for this item.");
      return;
    }
    if (!user) {
      setError("Please log in to place a bid.");
      return;
    }

    const raw = bidByItem[item.id];
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid bid amount.");
      return;
    }

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
      await addDoc(collection(db, "items", item.id, "bids"), {
        userId: user.uid,
        userEmail: user.email || "(no email)",
        amount,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "items", item.id), {
        topBidAmount: amount,
        topBidUserId: user.uid,
        topBidUserEmail: user.email || "(no email)",
        updatedAt: serverTimestamp(),
      });

      setBidByItem((m) => ({ ...m, [item.id]: "" }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page">
      <h2 className="pageTitle">Active Auction Items</h2>

      {error && <p className="errorText">{error}</p>}

      {items.length === 0 && (
        <p className="emptyText">No items yet. Check back soon.</p>
      )}

      <div className="itemsGrid">
        {items.map((item) => (
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

              <BidHistory itemId={item.id} open={!!historyOpen[item.id]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
