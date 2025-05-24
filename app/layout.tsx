// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar'; // Assuming your Navbar is in src/components or components
import { CartProvider } from '@/components/CartProvider'; // Assuming CartProvider is in src/components or components
import './globals.css'; // Your global styles

export const metadata = { // Example metadata - customize as needed
  title: 'GAY RETRO TCG',
  description: 'Your one-stop shop for Gay Retro Trading Cards!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body> {/* BODY tag is a direct child of HTML */}
        <ClerkProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main> {/* Page content will be rendered here */}
            {/* You could add a global Footer component here if you have one */}
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
