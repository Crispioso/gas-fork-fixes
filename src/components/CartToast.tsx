// src/components/CartToast.tsx
"use client";

import { useEffect } from "react";

interface CartToastProps {
  visible: boolean;
  itemName: string;
  onHide: () => void;
}

export default function CartToast({ visible, itemName, onHide }: CartToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 3000); // auto-hide after 3s
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "4rem",
        right: "1rem",
        backgroundColor: "#FF2B42",
        color: "#000",
        padding: "1rem 1.5rem",
        borderRadius: "12px",
        boxShadow: "0 0 12px rgba(0,0,0,0.5)",
        zIndex: 9999,
        animation: "slideIn 0.3s ease-out",
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      ✅ Added <strong>{itemName}</strong> to cart!
    </div>
  );
}
