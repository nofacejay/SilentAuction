import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/notifications.css";

export default function Notifications() {
  // Stores simulated emails
  const [notes, setNotes] = useState([]);

  // Subscribes to notifications ordered by sentAt desc
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("sentAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotes(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="notifPage">
      <h2 className="notifTitle">Notifications</h2>
      <p className="notifSubtitle">Simulated winner emails created when auctions are closed.</p>

      {notes.length === 0 && (
        <p className="emptyText">No notifications yet.</p>
      )}

      <div className="notifList">
        {notes.map((n) => (
          <div className="notifCard" key={n.id}>
            <div className="rowBetween">
              <strong className="to">To: {n.to || "(unknown)"}</strong>
              {n.sentAt?.toDate ? (
                <span className="sentAt">{n.sentAt.toDate().toLocaleString()}</span>
              ) : (
                <span className="sentAt">pending…</span>
              )}
            </div>

            <div className="subject">Subject: {n.subject || "(no subject)"}</div>
            <div className="body">{n.body || "(no body)"}</div>

            {n.itemId && (
              <div className="itemRef">Item ID: <code>{n.itemId}</code></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
