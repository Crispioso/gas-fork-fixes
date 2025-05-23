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

  return (
    <div className="max-w-xl mx-auto my-10 p-4 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-pastelBlue mb-4">Your Cart</h1>
      {cart.length === 0 ? (
        <div className="text-gray-400">Cart is empty.</div>
      ) : (
        <>
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center mb-2 text-slate-700">
              <div>
                <span className="font-bold">{item.name}</span> x {item.quantity}
                <span className="block text-xs text-gray-400">£{(item.price / 100).toFixed(2)} each</span>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-400 underline"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="mt-4 text-lg text-pastelBlue font-bold">
            Total: £{(total / 100).toFixed(2)}
          </div>
          <button
            className="mt-6 w-full bg-pastelMint text-black font-bold p-2 rounded"
            disabled={checkingOut || cart.length === 0}
            onClick={() => alert("Handle checkout logic here")}
          >
            {checkingOut ? "Processing..." : "Checkout"}
          </button>
          <button
            className="mt-2 w-full bg-gray-200 text-slate-600 font-bold p-2 rounded"
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}
