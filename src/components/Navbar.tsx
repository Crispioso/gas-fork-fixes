"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-pastelBlue py-4 px-2 flex items-center justify-between shadow-sm mb-4">
      <div className="text-lg font-bold pl-3 tracking-tight">
        Gay Reto TCG
      </div>
      <div className="flex gap-8 pr-3">
        <Link href="/shop" className="px-5 py-2 rounded-lg font-medium hover:bg-pastelMint transition">Shop</Link>
        <Link href="/cart" className="px-5 py-2 rounded-lg font-medium hover:bg-pastelMint transition">Cart</Link>
        <Link href="/admin" className="px-5 py-2 rounded-lg font-medium hover:bg-pastelMint transition">Admin</Link>
      </div>
    </nav>
  );
}