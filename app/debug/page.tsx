"use client";
import { useCart } from "@/components/CartProvider";

export default function CartDebug() {
  const value = useCart(); // <-- CALL the hook
  return (
    <div style={{ color: value === null ? "red" : "lime" }}>
      Cart context is {value === null ? "NULL" : "OK"}
    </div>
  );
}
