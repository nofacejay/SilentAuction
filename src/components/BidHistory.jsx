import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function BidHistory({ itemId, open }) {
  // Stores bids for the item
  const [bids, setBids] = useState([]);

  // Subscribes to bids in real time when panel is open
  useEffect(() => {
    if (!open) return;
    const q = query(
      collection(db, "items", itemId, "bids"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBids(list);
    });
    return () => unsub();
  }, [itemId, open]);

  if (!open) return null;

  return (
    <div className="history">
      {bids.length === 0 && <p className="historyEmpty">No bids yet.</p>}
      {bids.map((b) => (
        <div key={b.id} className="historyRow">
          <span className="amt">${Number(b.amount || 0).toFixed(2)}</span>
          <span className="by">{b.userEmail || b.userId}</span>
          <span className="time">
            {b.createdAt?.toDate
              ? b.createdAt.toDate().toLocaleString()
              : "pending..."}
          </span>
        </div>
      ))}
    </div>
  );
}
