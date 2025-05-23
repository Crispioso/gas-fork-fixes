"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext<any>(null);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("cart");
    if (existing) setCart(JSON.parse(existing));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  function addToCart(item: any) {
    setCart((prev) => {
      const idx = prev.findIndex((i: any) => i.id === item.id);
      if (idx !== -1) {
        const newCart = [...prev];
        newCart[idx].quantity += 1;
        return newCart;
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  if (!hydrated) return null;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}
