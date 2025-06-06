"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const existingCartJson = localStorage.getItem("cart");
      if (existingCartJson) {
        const loadedCart = JSON.parse(existingCartJson);
        if (Array.isArray(loadedCart) && loadedCart.every(item => 'id' in item && 'quantity' in item)) {
          setCart(loadedCart);
        } else {
          console.warn("Invalid cart data found in localStorage.");
          localStorage.removeItem("cart");
        }
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage:", error);
      localStorage.removeItem("cart");
    }
    setHydrated(true);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  // 🔁 Remove unavailable cards from cart after hydration
  useEffect(() => {
    if (!hydrated || cart.length === 0) return;

    async function removeUnavailableFromCart() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Card?id=in.(${cart.map(i => `"${i.id}"`).join(",")})&select=id,available`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            },
          }
        );

        const data = await res.json();
        const stillAvailableIds = new Set(data.filter((d: any) => d.available).map((d: any) => d.id));
        const updatedCart = cart.filter(item => stillAvailableIds.has(item.id));

        if (updatedCart.length !== cart.length) {
          console.log("🧹 Removing unavailable items from cart");
          setCart(updatedCart);
        }
      } catch (err) {
        console.error("❌ Failed to clean cart from unavailable items:", err);
      }
    }

    removeUnavailableFromCart();
  }, [hydrated, cart]);

  if (!hydrated) {
    return null;
  }

  function addToCart(item: Product) {
    setCart((prevCart) => {
      const exists = prevCart.find(i => i.id === item.id);
      if (exists) {
        console.warn(`Card ${item.id} already in cart.`);
        return prevCart;
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, Math.min(1, quantity)) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  function getTotalPrice() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
