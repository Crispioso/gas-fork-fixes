// utils/scryfall.ts

export async function fetchCardDetails(name: string) {
  const query = encodeURIComponent(name);
  const url = `https://api.scryfall.com/cards/named?fuzzy=${query}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Scryfall fetch failed for: ${name}`);
    return {
      name,
      imageUrl: "/placeholder.png",
      price: 0,
    };
  }

  const data = await res.json();
  const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal || "/placeholder.png";
  const priceGBP = parseFloat(data.prices?.gbp || "0.00");

  return {
    name: data.name,
    imageUrl,
    price: Math.round(priceGBP * 100), // price in pence for internal consistency
  };
}
