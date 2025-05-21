// 1. Import useCart alongside CartProvider
import { CartProvider, useCart } from "@/components/CartProvider";

// This is your CartDebug component, now correctly using useCart
function CartDebug() {
  "use client"; // This directive is important, marking it as a Client Component
  // 2. Call the imported useCart hook
  const value = useCart;();
  return (
    <div style={{ color: value === null ? "red" : "lime" }}>
      Cart context is {value === null ? "NULL" : "OK"}
    </div>
  );
}

// This is your RootLayout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* CartProvider wraps your page content and other client components that need cart context */}
        {/* CartProvider itself is correctly marked "use client" in its own file (src/components/CartProvider.tsx) */}
        <CartProvider>
          <CartDebug /> {/* CartDebug is rendered as a child of CartProvider */}
          {children}
        </CartProvider>
      </body>
    </html>
  );
}