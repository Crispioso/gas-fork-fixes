// app/admin/page.tsx
"use client";
import { useState, FormEvent } from "react";
import styles from '../styles/AdminPage.module.css'; // Adjust path if you have AdminPage.module.css in app/styles/
import Image from "next/image"; // For displaying search result images

// Define types for Pokémon TCG API response
interface PokemonTCGCardImage {
  small: string;
  large: string;
}

interface PokemonTCGCard {
  id: string;
  name: string;
  images: PokemonTCGCardImage;
  // Add other fields you might want from the API
}

interface PokemonTCGApiResponse {
  data: PokemonTCGCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

// Structure for storing selected image details
interface SelectedImageDetail {
  url: string;
  publicId?: string; // For Cloudinary uploads
  source: 'upload' | 'api'; // To distinguish origin
  apiCardName?: string; // Optional: name from API
}


export default function AdminUpload() {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // State for Pokémon TCG API Search
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
      console.error("Pokémon TCG API search error:", error);
      setMessage(`Error searching cards: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  const handleSelectApiImage = (card: PokemonTCGCard) => {
    // For simplicity, let's limit to adding just one API image for now, or you can manage multiple
    // If allowing multiple, push to an array. Here, we'll replace or add one.
    const newApiImage: SelectedImageDetail = {
        url: card.images.large,
        source: 'api',
        apiCardName: card.name
    };
    // Example: allow multiple API images to be selected along with uploaded files
    setSelectedApiImages(prev => [...prev, newApiImage]);
    setMessage(`${card.name} image selected. You can still upload your own files or select more.`);
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
      // 1. Upload manually selected files (if any)
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

      // 2. Process selected API images
      // For now, we'll assume we are saving the external URL directly.
      // A more robust solution would download and re-upload these to your Cloudinary.
      selectedApiImages.forEach(apiImg => {
        finalImageDetails.push({ url: apiImg.url, publicId: `api_${apiImg.apiCardName?.replace(/\s+/g, '_') || 'pokemon_image'}` }); // Create a pseudo publicId for API images if needed
      });

      if (finalImageDetails.length === 0) {
        throw new Error("No images were processed or selected.");
      }

      setMessage("All images processed. Adding card data...");
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

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h1 className={styles.formTitle}>Add New Card</h1>

      {/* Message Display Area */}
      {message && (
        <div
          style={{ /* Your existing message styles */
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

      {/* Card Details Inputs */}
      <div className={styles.formGroup}>
        <label htmlFor="cardName" className={styles.label}>Card Name</label>
        <input id="cardName" className={styles.inputField} type="text" placeholder="Enter card name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="cardPrice" className={styles.label}>Price (in pence)</label>
        <input id="cardPrice" className={styles.inputField} type="number" placeholder="e.g., 1999 for £19.99" value={price} onChange={(e) => setPrice(e.target.value)} required min="1" />
      </div>

      {/* Pokémon TCG API Search Section */}
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
          <button type="button" onClick={handlePokemonSearch} disabled={isSearching || !searchTerm.trim()} className={styles.searchButton}> {/* Style .searchButton */}
            {isSearching ? "Searching..." : "Search API"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className={styles.searchResultsContainer}> {/* Style .searchResultsContainer */}
            {searchResults.map(card => (
              <div key={card.id} className={styles.searchResultItem}> {/* Style .searchResultItem */}
                <Image src={card.images.small} alt={card.name} width={60} height={84} style={{ imageRendering: 'pixelated', border: '1px solid #ccc' }} />
                <span style={{ flexGrow: 1, paddingLeft: '10px' }}>{card.name}</span>
                <button type="button" onClick={() => handleSelectApiImage(card)} className={styles.selectImageButton}> {/* Style .selectImageButton */}
                  Use Image
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Display selected API images (optional visual feedback) */}
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

      {/* Manual File Upload Section */}
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
