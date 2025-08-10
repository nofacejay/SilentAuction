import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import "../styles/admin.css";

export default function AdminDashboard() {
  // stores current list of items
  const [items, setItems] = useState([]);
  // add-item form fields
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  // UI messages
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // fetch all items
  const fetchItems = async () => {
    const snap = await getDocs(collection(db, "items"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setItems(list);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // create new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!title.trim() || !desc.trim() || !image.trim()) {
      setError("All fields are required.");
      return;
    }

    try {
      await addDoc(collection(db, "items"), {
        title: title.trim(),
        description: desc.trim(),
        image: image.trim(),
        topBidAmount: 0,
        topBidUserId: null,
        topBidUserEmail: null,
        isClosed: false,
        winnerUserId: null,
        winnerUserEmail: null,
        winnerAmount: null,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setDesc("");
      setImage("");
      await fetchItems();
      setInfo("Item added.");
    } catch (e2) {
      setError(e2.message);
    }
  };

  // delete item (delete subcollection bids first, then item)
  const handleDelete = async (itemId) => {
    setError("");
    setInfo("");

    try {
      const bidsSnap = await getDocs(collection(db, "items", itemId, "bids"));
      const deletions = bidsSnap.docs.map((b) =>
        deleteDoc(doc(db, "items", itemId, "bids", b.id))
      );
      await Promise.all(deletions);

      await deleteDoc(doc(db, "items", itemId));

      await fetchItems();
      setInfo("Item deleted.");
    } catch (e) {
      setError(e.message);
    }
  };

  // compute winner from bids and sync topBid fields
  const declareWinner = async (itemId) => {
    const bidsQ = query(
      collection(db, "items", itemId, "bids"),
      orderBy("amount", "desc"),
      limit(1)
    );
    const bidsSnap = await getDocs(bidsQ);

    if (bidsSnap.empty) {
      await updateDoc(doc(db, "items", itemId), {
        winnerUserId: null,
        winnerUserEmail: null,
        winnerAmount: null,
      });
      return null;
    }

    const top = bidsSnap.docs[0].data();
    const winner = {
      userId: top.userId || null,
      userEmail: top.userEmail || null,
      amount: Number(top.amount || 0),
    };

    // keep leaderboard + winner in sync so Top bid is accurate
    await updateDoc(doc(db, "items", itemId), {
      winnerUserId: winner.userId,
      winnerUserEmail: winner.userEmail,
      winnerAmount: winner.amount,
      topBidAmount: winner.amount,
      topBidUserId: winner.userId,
      topBidUserEmail: winner.userEmail,
      updatedAt: serverTimestamp(),
    });

    return winner;
  };

  // close auction
  const handleClose = async (itemId) => {
    setError("");
    setInfo("");
    try {
      const winner = await declareWinner(itemId);

      await updateDoc(doc(db, "items", itemId), {
        isClosed: true,
        closedAt: serverTimestamp(),
      });

      if (winner && winner.userEmail) {
        const item = items.find((i) => i.id === itemId);
        setInfo(
          `Auction closed. Winner: ${winner.userEmail} — $${winner.amount.toFixed(2)}${
            item?.title ? ` (${item.title})` : ""
          }.`
        );
      } else {
        setInfo("Auction closed. No bids were placed.");
      }

      await fetchItems();
    } catch (e) {
      setError(e.message);
    }
  };

  // reopen auction
  const handleReopen = async (itemId) => {
    setError("");
    setInfo("");
    try {
      await updateDoc(doc(db, "items", itemId), {
        isClosed: false,
        winnerUserId: null,
        winnerUserEmail: null,
        winnerAmount: null,
        closedAt: null,
      });
      await fetchItems();
      setInfo("Auction reopened.");
    } catch (e) {
      setError(e.message);
    }
  };

  // recompute winner without closing
  const handleComputeWinnerOnly = async (itemId) => {
    setError("");
    setInfo("");
    try {
      const winner = await declareWinner(itemId);
      await fetchItems();
      if (winner && winner.userEmail) {
        setInfo(`Winner recomputed: ${winner.userEmail} — $${winner.amount.toFixed(2)}.`);
      } else {
        setInfo("No bids found for this item.");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="adminPage">
      <div className="headerBar">
        <span className="accentDot" />
        <h2 className="pageTitle">Admin Dashboard</h2>
      </div>

      {error && <p className="errorText">{error}</p>}
      {info && <p className="infoText">{info}</p>}

      <form className="itemForm" onSubmit={handleAddItem}>
        <input
          type="text"
          placeholder="Item title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />
        <textarea
          placeholder="Item description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          className="input"
        />
        <input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="input"
        />
        <button type="submit" className="btn btnPrimary">Add Item</button>
      </form>

      <div className="sectionHeader">
        <h3 className="sectionTitle">Current Auction Items</h3>
      </div>

      <div className="itemsGrid">
        {items.length === 0 && <p className="emptyText">No items yet.</p>}
        {items.map((it) => {
          // show true top bid even for older items
          const safeTop =
            Math.max(Number(it.topBidAmount || 0), Number(it.winnerAmount || 0)) || 0;

          return (
            <div key={it.id} className="itemCard">
              {it.image && <img className="thumb" src={it.image} alt={it.title} />}
              <div className="itemBody">
                <div className="rowBetween">
                  <h4 className="itemTitle">{it.title}</h4>
                  <span className={`badge ${it.isClosed ? "badgeClosed" : "badgeOpen"}`}>
                    {it.isClosed ? "Closed" : "Open"}
                  </span>
                </div>

                <p className="itemDesc">{it.description}</p>

                <p className="meta">Top bid: ${safeTop.toFixed(2)}</p>

                {it.winnerUserEmail && (
                  <p className="winner">
                    Winner: {it.winnerUserEmail} — $
                    {Number(it.winnerAmount || 0).toFixed(2)}
                  </p>
                )}

                <div className="btnRow">
                  {!it.isClosed ? (
                    <>
                      <button className="btn btnPrimary" onClick={() => handleClose(it.id)}>
                        Close & Declare Winner
                      </button>
                      <button
                        className="btn btnGhost"
                        onClick={() => handleComputeWinnerOnly(it.id)}
                      >
                        Compute Winner (Preview)
                      </button>
                    </>
                  ) : (
                    <button className="btn btnWarn" onClick={() => handleReopen(it.id)}>
                      Reopen Auction
                    </button>
                  )}
                  <button className="btn btnDanger" onClick={() => handleDelete(it.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
