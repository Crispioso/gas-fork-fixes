"use client";
import { useCart } from "@/components/CartProvider";

export default function DebugPage() {
  const value = useCart();
  return (
    <div style={{ color: value === null ? "red" : "lime" }}>
      Cart context is {value === null ? "NULL" : "OK"}
    </div>
  );
}
