// app/admin/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import styles from '../styles/AdminPage.module.css';
import Image from "next/image";

interface PokemonTCGCardImage {
  small: string;
  large: string;
}

interface PokemonTCGCard {
  id: string;
  name: string;
  images: PokemonTCGCardImage;
}

interface PokemonTCGApiResponse {
  data: PokemonTCGCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

interface SelectedImageDetail {
  url: string;
  publicId?: string;
  source: 'upload' | 'api';
  apiCardName?: string;
}

export default function AdminUpload() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role;
      if (role !== "admin") {
        setAccessDenied(true);
        router.push("/");
      }
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) return <div>Loading...</div>;
  if (accessDenied) return null;

  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PokemonTCGCard[]>([]);
  const [selectedApiImages, setSelectedApiImages] = useState<SelectedImageDetail[]>([]);

  async function handlePokemonSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setMessage("Please enter a Pokémon card name to search.");
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setMessage(`Searching for "${searchTerm}"...`);
    setSearchResults([]);

    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:\"${encodeURIComponent(searchTerm)}*\"&pageSize=10`);
      const data: PokemonTCGApiResponse = await response.json();
      setSearchResults(data.data || []);
      setMessage(data.data.length > 0 ? `${data.data.length} cards found.` : "No cards found.");
    } catch (error: any) {
      console.error("API error:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  }

  const handleSelectApiImage = (card: PokemonTCGCard) => {
    setSelectedApiImages(prev => [...prev, {
      url: card.images.large,
      source: 'api',
      apiCardName: card.name
    }]);
    setMessage(`${card.name} image selected.`);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || (!files && selectedApiImages.length === 0) || !price) {
      setMessage("Name, price, and image required.");
      return;
    }
    const priceInPence = Number(price);
    if (isNaN(priceInPence) || priceInPence <= 0) {
      setMessage("Price must be a positive number.");
      return;
    }

    setUploading(true);
    const finalImageDetails: { url: string; publicId?: string }[] = [];

    try {
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const imageFormData = new FormData();
          imageFormData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: imageFormData,
          });
          const { url, public_id } = await uploadRes.json();
          finalImageDetails.push({ url, publicId: public_id });
        }
      }

      selectedApiImages.forEach(img => {
        finalImageDetails.push({
          url: img.url,
          publicId: `api_${img.apiCardName?.replace(/\s+/g, '_')}`
        });
      });

      const cardData = {
        name,
        imageDetails: finalImageDetails,
        price: priceInPence,
      };

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData),
      });

      if (!res.ok) throw new Error("Failed to add card.");
      setMessage("Card added successfully.");
      setName(""); setFiles(null); setPrice(""); setSearchTerm(""); setSearchResults([]); setSelectedApiImages([]);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h1 className={styles.formTitle}>Add New Card</h1>
      {message && <div className={styles.messageBox}>{message}</div>}

      {/* Card Form UI Here */}
      {/* ... include name input, price input, image upload, API search, submit button ... */}

    </form>
  );
}
