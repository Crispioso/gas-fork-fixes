"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "../styles/ShopPage.module.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from "@/components/CartProvider";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Supabase
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ShopPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("");
  const [setName, setSetName] = useState("");
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  const fetchCards = async () => {
    setLoading(true);
    let query = supabase.from("Card").select("*").eq("available", true);

    if (search) query = query.ilike("name", `%${search}%`);
    if (setName) query = query.ilike("set", `%${setName}%`);
    if (rarity) query = query.ilike("rarity", `%${rarity}%`);

    const { data, error } = await query.order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching cards:", error);
      setError("Failed to load cards.");
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [search, rarity, setName]);

  const handleAddToCart = (card: any) => {
    addToCart({
      id: card.id,
      name: card.name,
      price: card.price,
      imageUrl: card.image_url,
    });
    toast.success(`${card.name} added to cart!`);
  };

  return (
    <main className={styles.pageContainer}>
      {/* ✅ Banner Image */}
      <div className={styles.shopImageBanner}>
        <img
          src="/banner3.png"
          alt="Colorful trading card game banner"
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {/* ✅ Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Flip}
        style={{ marginTop: "4rem" }}
        theme="colored"
      />

      <div className="container mt-4">
        {/* ✅ Filters */}
        <div className="row mb-3">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by card name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by set name..."
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <select
              className="form-select"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            >
              <option value="">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Holo Rare">Holo Rare</option>
              <option value="Secret Rare">Secret Rare</option>
              <option value="Promo">Promo</option>
            </select>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="text-muted">Loading cards...</div>}

        {/* ✅ Card Grid */}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {cards.map((card) => (
            <div key={card.id} className="col">
              <div className={`card h-100 animate__animated animate__flipInY`}>
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="card-img-top"
                />
                <div className="card-body">
                  <h5 className="card-title">{card.name}</h5>
                  <p className="card-text">
                    {typeof card.price === "number"
                      ? `£${(card.price / 100).toFixed(2)}`
                      : "N/A"}
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      {card.set} — #{card.number}
                    </small>
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddToCart(card)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
