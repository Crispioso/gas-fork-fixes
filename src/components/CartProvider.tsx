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
  removeFromCart: (id: string) => void; // Assuming ID is a string
  updateQuantity: (id: string, quantity: number) => void; // Added
  clearCart: () => void;
  getTotalPrice: () => number; // Added
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; // Exposing setCart if needed, though usually not directly
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

  // Load cart from localStorage on initial mount
  useEffect(() => {
    try {
      const existingCartJson = localStorage.getItem("cart");
      if (existingCartJson) {
        const loadedCart = JSON.parse(existingCartJson);
        // Basic validation for loaded cart (optional but good practice)
        if (Array.isArray(loadedCart) && loadedCart.every(item => 'id' in item && 'quantity' in item)) {
          setCart(loadedCart);
        } else {
          console.warn("Invalid cart data found in localStorage.");
          localStorage.removeItem("cart"); // Clear invalid data
        }
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage:", error);
      localStorage.removeItem("cart"); // Clear potentially corrupted data
    }
    setHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes, but only after hydration
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  function addToCart(item: Product) {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((i) => i.id === item.id);
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1,
        };
        return newCart;
      } else {
        // New item, add to cart with quantity 1
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  }

  function removeFromCart(id: string) { // Assuming ID is a string
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  }

  function updateQuantity(id: string, quantity: number) { // Assuming ID is a string
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
        )
        .filter((item) => item.quantity > 0) // Remove item if quantity becomes 0 or less
    );
  }

  function clearCart() {
    setCart([]);
  }

  function getTotalPrice() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  // Prevent rendering children until cart is hydrated from localStorage
  // This avoids potential hydration mismatch errors with Next.js
  if (!hydrated) {
    return null; // Or a loading spinner, or a skeleton UI
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
        setCart, // Exposing setCart if direct manipulation is ever needed, though usually avoided
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
