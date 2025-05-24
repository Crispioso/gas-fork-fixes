// app/admin/page.tsx
"use client";
import { useState, FormEvent } from "react";
import styles from '../styles/AdminPage.module.css'; // Adjust path if you place it in app/styles/

export default function AdminUpload() {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileList | null>(null); // Changed to FileList for multiple files
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!name || !files || files.length === 0 || !price) {
      setMessage("Card name, at least one image, and price are required.");
      return;
    }

    const priceInPence = Number(price);
    if (isNaN(priceInPence) || priceInPence <= 0) {
      setMessage("Price must be a positive number (in pence).");
      return;
    }

    setUploading(true);
    const uploadedImageUrls: { url: string; publicId?: string }[] = [];

    try {
      // 1. Upload all selected images
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageFormData = new FormData();
        imageFormData.append("file", file);

        setMessage(`Uploading image ${i + 1} of ${files.length}...`);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({ message: `Image ${i + 1} upload failed.` }));
          throw new Error(errorData.message || `Image ${i + 1} upload failed.`);
        }
        const { url, public_id } = await uploadRes.json();
        uploadedImageUrls.push({ url, publicId: public_id });
      }

      setMessage("All images uploaded. Adding card data...");
      // 2. Submit card data with all image URLs
      const cardData = {
        name,
        imageDetails: uploadedImageUrls, // Send array of {url, publicId}
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

      setMessage("Card added successfully with all images!");
      setName("");
      setFiles(null);
      setPrice("");
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = ''; // Clear file input
      }

    } catch (error: any) {
      setMessage(`Error: ${error.message || "An unexpected error occurred."}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h1 className={styles.formTitle}>Add New Card</h1>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '6px',
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
        <input
          id="cardName"
          className={styles.inputField}
          type="text"
          placeholder="Enter card name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="file-input" className={styles.label}>Card Images (select multiple)</label>
        <input
          id="file-input"
          className={`${styles.inputField} ${styles.fileInput}`}
          type="file"
          accept="image/*"
          multiple // Allow multiple file selection
          onChange={(e) => setFiles(e.target.files)} // Store the FileList
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="cardPrice" className={styles.label}>Price (in pence)</label>
        <input
          id="cardPrice"
          className={styles.inputField}
          type="number"
          placeholder="e.g., 1999 for £19.99"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="1"
        />
      </div>

      <button
        className={styles.submitButton}
        type="submit"
        disabled={uploading}
      >
        {uploading ? (message.includes("Uploading image") ? message : "Processing...") : "Add Card"}
      </button>
    </form>
  );
}
