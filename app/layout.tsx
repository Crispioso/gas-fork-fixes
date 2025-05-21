import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

function CartDebug() {
  "use client";
  const value = require("@/components/CartProvider").useCart();
  return (
    <div style={{ color: value === null ? "red" : "lime" }}>
      Cart context is {value === null ? "NULL" : "OK"}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <CartDebug />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
