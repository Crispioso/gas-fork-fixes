// utils/scryfall.ts

export async function fetchCardDetails(name: string) {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    if (!response.ok) {
      throw new Error(`Card not found: ${name}`);
    }
    const data = await response.json();

    const imageUrl = data.image_uris?.normal || data.image_uris?.small || "/placeholder.png";
    const price = data.prices?.gbp ? Math.round(parseFloat(data.prices.gbp) * 100) : 100;

    return {
      name: data.name,
      imageUrl,
      price,
    };
  } catch (error) {
    console.error(`Error fetching card details for '${name}':`, error);
    return {
      name,
      imageUrl: "/placeholder.png",
      price: 100,
    };
  }
}
