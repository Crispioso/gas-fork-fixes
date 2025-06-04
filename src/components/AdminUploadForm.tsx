// src/components/AdminUploadForm.tsx
"use client"; 

import { useState, FormEvent } from "react";
// Corrected relative path to AdminPage.module.css
import styles from '../../app/styles/AdminPage.module.css'; 
import Image from "next/image";

// Define types for Pokémon TCG API response
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

export default function AdminUploadForm() {
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
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(searchTerm)}*"&pageSize=10`);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Pokémon TCG API: ${response.statusText}`);
      }
      const data: PokemonTCGApiResponse = await response.json();
      setSearchResults(data.data || []);
      setMessage(data.data && data.data.length > 0 ? `${data.data.length} cards found.` : "No cards found.");
    } catch (error: any) {
      console.error("API error:", error);
      setMessage(`Error searching cards: ${error.message}`);
      setSearchResults([]);
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
    setMessage("");

    if (!name || (!files && selectedApiImages.length === 0) || (files && files.length === 0 && selectedApiImages.length === 0) || !price) {
      setMessage("Card name, at least one image (uploaded or selected from API), and price are required.");
      return;
    }

    const priceInPence = Number(price);
    if (isNaN(priceInPence) || priceInPence <= 0) {
      setMessage("Price must be a positive number (in pence).");
      return;
    }

    setUploading(true);
    const finalImageDetails: { url: string; publicId?: string }[] = [];

    try {
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const imageFormData = new FormData();
          imageFormData.append("file", file);

          setMessage(`Uploading your image ${i + 1} of ${files.length}...`);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: imageFormData,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({ message: `Your image ${i + 1} upload failed.` }));
            throw new Error(errorData.message || `Your image ${i + 1} upload failed.`);
          }
          const { url, public_id } = await uploadRes.json();
          finalImageDetails.push({ url, publicId: public_id });
        }
      }

      selectedApiImages.forEach(img => {
        finalImageDetails.push({
          url: img.url,
          publicId: `api_${img.apiCardName?.replace(/\s+/g, '_') || 'pokemon_image'}`
        });
      });

      if (finalImageDetails.length === 0) {
        throw new Error("No images were processed or selected.");
      }

      setMessage("All images uploaded. Adding card data...");
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to add card." }));
        throw new Error(errorData.message || "Failed to add card.");
      }

      setMessage("Card added successfully!");
      setName("");
      setFiles(null);
      setPrice("");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedApiImages([]);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setMessage(`Error: ${error.message || "An unexpected error occurred."}`);
    } finally {
      setUploading(false);
    }
  }

  // The return JSX for the form remains the same
  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h1 className={styles.formTitle}>Add New Card</h1>
      {message && (
        <div
          style={{
            padding: '10px', marginBottom: '15px', borderRadius: '6px',
            backgroundColor: message.startsWith('Error:') ? '#ffdddd' : (message.includes("successfully") ? '#ddffdd' : '#eeeeee'),
            color: message.startsWith('Error:') ? '#d8000c' : (message.includes("successfully") ? '#4f8a10' : '#333333'),
            border: `1px solid ${message.startsWith('Error:') ? '#ffc3c3' : (message.includes("successfully") ? '#c3ffc3' : '#cccccc')}`,
            textAlign: 'center'
          }}
        >
          {message}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="cardName" className={styles.label}>Card Name</label>
        <input id="cardName" className={styles.inputField} type="text" placeholder="Enter card name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="cardPrice" className={styles.label}>Price (in pence)</label>
        <input id="cardPrice" className={styles.inputField} type="number" placeholder="e.g., 1999 for £19.99" value={price} onChange={(e) => setPrice(e.target.value)} required min="1" />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="pokemonSearch" className={styles.label}>Search Pokémon Card Image (Optional)</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            id="pokemonSearch"
            className={styles.inputField}
            type="text"
            placeholder="Enter Pokémon name (e.g., Pikachu)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" onClick={handlePokemonSearch} className={styles.searchButton} disabled={isSearching || !searchTerm.trim()}>
            {isSearching ? "Searching..." : "Search API"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className={styles.searchResultsContainer}>
            {searchResults.map(card => (
              <div key={card.id} className={styles.searchResultItem}>
                <Image src={card.images.small} alt={card.name} width={60} height={84} style={{ imageRendering: 'pixelated', border: '1px solid #ccc' }}/>
                <span style={{ flexGrow: 1, paddingLeft: '10px' }}>{card.name}</span>
                <button type="button" onClick={() => handleSelectApiImage(card)} className={styles.selectImageButton}>
                  Use Image
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedApiImages.length > 0 && (
        <div className={styles.formGroup}>
            <p className={styles.label}>Selected API Images:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedApiImages.map((img, index) => (
                    <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <Image src={img.url} alt={img.apiCardName || 'API Image'} width={40} height={56} style={{imageRendering: 'pixelated', border: '1px solid #ccc'}}/>
                        <span>{img.apiCardName || 'API Image'}</span>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="file-input" className={styles.label}>Or Upload Your Own Image(s) (select multiple)</label>
        <input
          id="file-input"
          className={`${styles.inputField} ${styles.fileInput}`}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />
      </div>

      <button className={styles.submitButton} type="submit" disabled={uploading}>
        {uploading ? (message.includes("Uploading image") ? message : "Processing...") : "Add Card"}
      </button>
    </form>
  );
}
