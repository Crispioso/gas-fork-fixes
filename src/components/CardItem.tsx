import { useState } from "react";
import { useCart } from "./CartProvider";

export default function CardItem({ card }: { card: any }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    // Ensure the card object includes cardId for checkout
    addToCart({ ...card, cardId: card.id });
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  }

  return (
    <div
      className="bg-black border-4 border-neonPink rounded-2xl shadow-lg p-4 flex flex-col items-center relative hover:scale-110 transition-transform duration-200 ease-in-out"
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
        onClick={handleAddToCart}
        className="px-4 py-2 bg-neonGreen text-black font-bold rounded-full hover:bg-neonPink hover:text-white border-2 border-neonCyan transition"
      >
        {added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}