"use client"
import { useState } from "react"

export default function AdminUpload() {
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [price, setPrice] = useState("")
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !file || !price) {
      alert("All fields are required.")
      return
    }
    setUploading(true)
    // 1. Upload image to /api/upload
    const formData = new FormData()
    formData.append("file", file)
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: file,
    })
    const { url: imageUrl } = await uploadRes.json()
    // 2. Submit card data
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        imageUrl,
        price: Number(price),
      }),
    })
    setUploading(false)
    if (res.ok) {
      alert("Card added!")
      setName("")
      setFile(null)
      setPrice("")
    } else {
      alert("Error adding card.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto my-10 p-6 border bg-black rounded shadow space-y-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Add New Card</h1>
      <input
        className="w-full p-2 rounded mb-2"
        type="text"
        placeholder="Card Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        className="w-full p-2 rounded mb-2"
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
      />
      <input
        className="w-full p-2 rounded mb-2"
        type="number"
        placeholder="Price (in pence, e.g., 1999)"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />
      <button
        className="w-full bg-neonPink p-2 rounded font-bold"
        type="submit"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Add Card"}
      </button>
    </form>
  )
}
