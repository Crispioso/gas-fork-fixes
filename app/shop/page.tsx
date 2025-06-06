"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
// filepath: c:\dev\gay-reto-tcg\app\shop\page.tsx
import styles from "../styles/ShopPage.module.css"; // Import ShopPage.module.css last
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap first

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

  useEffect(() => {
    const fetchCards = async () => {
      const { data, error } = await supabase
        .from("Card")
        .select("*")
        .eq("available", true)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Error fetching cards:", error);
        setError("Failed to load cards.");
      } else {
        setCards(data || []);
      }
    };

    fetchCards();
  }, []);

  if (error) return <div className="alert alert-danger p-4">{error}</div>;
  if (!cards.length) return <div className="p-4 text-muted">Loading cards...</div>;

  return (
    <main className={styles.pageContainer}>
      <div className={styles.shopImageBanner}>
        <img
          src="/banner3.png"
          alt="Colorful retro trading card game banner featuring vibrant characters in playful poses with bold Gay Retro TCG text in the center, set against a lively and energetic background"
          style={{ width: "100%"}} />
      </div>

      <div className="container"> {/* Bootstrap Container */}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 mt-3"> {/* Bootstrap Grid Classes */}
          {cards.map((card) => (
            <div key={card.id} className="col"> {/* Bootstrap Column */}
              <div className="card h-100"> {/* Bootstrap Card */}
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="card-img-top" // or styles.productImage if you keep that
                />
                <div className="card-body">
                  <h5 className="card-title">{card.name}</h5>
                  <p className="card-text">
                    {typeof card.price === "number"
                      ? `$${(card.price / 100).toFixed(2)}`
                      : "N/A"}
                  </p>
                  <p className="card-text"><small className="text-muted">{card.set} — #{card.number}</small></p>
                  
                  <button className="btn btn-primary">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}