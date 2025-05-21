"use client";
import useSWR from "swr";
import { useCart } from "@/components/CartProvider";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ShopPage() {
  const { data: cards, error } = useSWR("/api/cards", fetcher);
  const { addToCart } = useCart();

  if (error) return <div className="text-red-500">Failed to load cards.</div>;
  if (!cards) return <div className="text-white">Loading cards…</div>;

  return (
    <main className="max-w-5xl mx-auto py-10">
      <h1 className="text-4xl font-['Press_Start_2P',monospace] text-neonPink mb-8 text-center drop-shadow">
        GAY RETO TCG Shop
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {cards.map((card: any) => (
          <div
            key={card.id}
            className="bg-black border-4 border-neonPink rounded-2xl shadow-lg p-4 flex flex-col items-center relative hover:scale-105 transition-transform"
          >
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-48 h-64 object-cover rounded-xl mb-4 border-2 border-white shadow"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="font-['Press_Start_2P',monospace] text-lg text-neonCyan mb-2 text-center">
              {card.name}
            </div>
            <div className="text-xl text-white font-bold mb-4">
              £{(card.price / 100).toFixed(2)}
            </div>
            <button
              onClick={() => addToCart(card)}
              className="px-4 py-2 bg-neonGreen text-black font-bold rounded-full hover:bg-neonPink hover:text-white border-2 border-neonCyan transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
