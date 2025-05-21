"use client";
import { useCart } from "@/components/CartProvider";
import { useState } from "react";

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  const total = cart.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  async function handleCheckout() {
    setCheckingOut(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((item: any) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    });
    const data = await res.json();
    setCheckingOut(false);
    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe checkout
    } else {
      alert("Error with checkout");
    }
  }

  return (
    <div className="max-w-xl mx-auto my-10 p-4 bg-black rounded">
      <h1 className="text-2xl font-bold text-white mb-4">Your Cart</h1>
      {cart.length === 0 && (
        <div className="text-gray-400">Cart is empty.</div>
      )}
      {cart.map((item: any) => (
        <div
          key={item.id}
          className="flex justify-between items-center mb-2 text-white"
        >
          <span>
            {item.name} x {item.quantity}
          </span>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-red-400"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="mt-4 text-lg text-white font-bold">
        Total: £{(total / 100).toFixed(2)}
      </div>
      <button
        className="mt-6 w-full bg-neonPink text-black font-bold p-2 rounded"
        disabled={checkingOut || cart.length === 0}
        onClick={handleCheckout}
      >
        {checkingOut ? "Processing..." : "Checkout"}
      </button>
      {cart.length > 0 && (
        <button
          className="mt-2 w-full bg-gray-800 text-white font-bold p-2 rounded"
          onClick={clearCart}
        >
          Clear Cart
        </button>
      )}
    </div>
  );
}
