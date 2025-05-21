"use client";

import useSWR from "swr";
import { useCart } from "@/components/CartProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import CardItem from "@/components/CardItem";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ShopPage() {
  const { data: cards, error } = useSWR("/api/cards", fetcher);
  const { addToCart } = useCart();
  

  if (error) return <div className="text-red-500">Failed to load cards.</div>;
  if (!cards) return <LoadingSpinner />;

  return (
    <main className="max-w-5xl mx-auto py-10">
      <h1 className="text-4xl font-['Press_Start_2P',monospace] text-neonPink mb-8 text-center drop-shadow">
        GAY RETO TCG Shop
      </h1>
      <div className="grid grid-cols-3 sm:grid-cols-1 md:grid-cols-3 gap-8">

        {cards.map((card: any) => (
          <div
            key={card.id}
            className="bg-black border-4 border-neonPink rounded-2xl shadow-lg p-4 flex flex-col items-center relative hover:scale-101 transition-transform duration-200"
          >
            <img
  src={card.imageUrl}
  alt={card.name}
  className="card-img"
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
      <div className="bg-green-500 text-white text-3xl p-10">TAILWIND IS WORKING</div>

    </main>
  );
}
