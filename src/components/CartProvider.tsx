// src/components/CartProvider.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define types for better type safety
interface Product {
  id: string; // Assuming ID is a string, adjust if it's a number
  name: string;
  price: number; // Assuming price is in pence
  imageUrl: string;
  // Add any other product properties you might have
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

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, hydrated]);

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

  if (!hydrated) {
    return null;
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
