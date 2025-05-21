"use client"
import useSWR from "swr"
import { useCart } from "@/components/CartProvider"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ShopPage() {
  const { data: cards, isLoading } = useSWR("/api/cards", fetcher)
  const { addToCart } = useCart()

  if (isLoading) return <div>Loading cards...</div>

  return (
    <div className="max-w-4xl mx-auto py-10 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {cards?.map((card: any) => (
        <div key={card.id} className="bg-black p-4 rounded shadow-lg flex flex-col items-center">
          <img src={card.imageUrl} alt={card.name} className="mb-2 max-h-48 rounded" />
          <div className="text-lg font-bold text-white">{card.name}</div>
          <div className="text-neonPink mb-2">£{(card.price / 100).toFixed(2)}</div>
          <button
            className="bg-neonCyan text-black px-3 py-1 rounded font-bold mt-auto"
            onClick={() => addToCart(card)}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  )
}
