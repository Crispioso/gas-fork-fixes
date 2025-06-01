// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css'; // Your Navbar styles
import { useCart } from '@/components/CartProvider';
import { UserButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"; // Import useUser

export default function Navbar() {
  const pathname = usePathname();
  const { cart } = useCart();
  const { user } = useUser(); // Get the current user object from Clerk

  const totalCartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if the current user is an admin
  // This assumes you're setting publicMetadata: { role: 'admin' } in Clerk for admin users
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const navLinks = [
    { href: "/shop", label: "Shop" },
    // Admin link will be added conditionally below
  ];

  return (
    <nav className={styles.navbar}>
      <Link href="/shop" className={styles.logoLink} aria-label="GAY RETRO TCG Home">
        <div className={styles.logoContainer}>
          <svg width="30" height="40" viewBox="0 0 6 8" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }} aria-hidden="true">
            <rect fill="#FF0000" x="0" y="0" width="6" height="2"/>
            <rect fill="#FF7F00" x="0" y="2" width="6" height="1"/>
            <rect fill="#FFFF00" x="0" y="3" width="6" height="1"/>
            <rect fill="#00FF00" x="0" y="4" width="6" height="1"/>
            <rect fill="#0000FF" x="0" y="5" width="6" height="1"/>
            <rect fill="#8B00FF" x="0" y="6" width="6" height="2"/>
            <rect fill="#374151" x="1" y="1" width="4" height="6" opacity="0.6"/>
            <rect fill="#FFFFFF" x="2" y="3" width="2" height="2" opacity="0.8"/>
          </svg>
        </div>
      </Link>
      <ul className={styles.navList}>
        {navLinks.map((link) => (
          <li key={link.href} className={styles.navItem}>
            <Link href={link.href} className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}>
              {link.label}
            </Link>
          </li>
        ))}
        <li className={styles.navItem}>
          <Link href="/cart" className={`${styles.navLink} ${pathname === "/cart" ? styles.navLinkActive : ''}`}>
            Cart
            {totalCartQuantity > 0 && (
              <span className={styles.cartQuantityBadge}>{totalCartQuantity}</span>
            )}
          </Link>
        </li>

        {/* Conditionally render Admin link if user is an admin */}
        <SignedIn> {/* Ensures user is signed in before checking admin status */}
          {isAdmin && (
            <li className={styles.navItem}>
              <Link href="/admin" className={`${styles.navLink} ${pathname === "/admin" ? styles.navLinkActive : ''}`}>
                Admin
              </Link>
            </li>
          )}
        </SignedIn>

        {/* Clerk Authentication Controls */}
        <li className={styles.navItem}>
          <SignedIn>
            <UserButton afterSignOutUrl="" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className={styles.navLink}>Sign In</Link>
          </SignedOut>
        </li>
      </ul>
    </nav>
  );
}

//