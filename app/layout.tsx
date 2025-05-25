import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import { CartProvider } from '@/components/CartProvider';
import './globals.css';

export const metadata = {
  title: 'GAY RETRO TCG',
  description: 'Your one-stop shop for Gay Retro Trading Cards!',
  icons: {
    icon: '/favicon.ico',
  },
  // ...other metadata...
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}