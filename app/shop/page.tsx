// app/shop/page.tsx
"use client";

import { useCart } from "@/components/CartProvider";
import CartToast from "@/components/CartToast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../styles/ShopPage.module.css";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";

interface ImageType {
  id: string;
  url: string;
  publicId?: string | null;
}

interface CardItemType {
  id: string;
  name: string;
  images: ImageType[];
  price: number;
  image_url?: string; // <- added for stock image support
}


const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ShopPage() {
  const { data: rawCards, error: cardsError } = useSWR<CardItemType[]>("/api/cards", fetcher);
  const cards = rawCards?.map(card => ({
  ...card,
  images: card.images?.length
    ? card.images
    : card.image_url
    ? [{ id: `stock-${card.id}`, url: card.image_url }]
    : []
})) ?? [];


  const { cart, addToCart } = useCart();
  const router = useRouter();

  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [lastAddedCard, setLastAddedCard] = useState<{ name: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const [selectedImagesForModal, setSelectedImagesForModal] = useState<ImageType[] | null>(null);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentCardImageIndexes, setCurrentCardImageIndexes] = useState<{ [cardId: string]: number }>({});

  const handleAddToCart = (card: CardItemType) => {
    const currentImageIndex = currentCardImageIndexes[card.id] || 0;
    const imageUrl = card.images?.[currentImageIndex]?.url || "/placeholder.png";

    const itemToAdd = {
      ...card,
      imageUrl,
    };

    const itemAlreadyInCart = cart.some(cartItem => cartItem.id === card.id);
    if (!itemAlreadyInCart) {
      addToCart(itemToAdd);
      setAddedItemId(card.id);
      setLastAddedCard({ name: card.name });
      setShowNotification(true);
      setTimeout(() => setAddedItemId(null), 2000);
    }
  };

  const openModal = useCallback((images: ImageType[], startIndex: number = 0) => {
    if (images && images.length > 0) {
      setSelectedImagesForModal(images);
      setCurrentModalImageIndex(startIndex);
      setIsModalOpen(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImagesForModal(null);
    setCurrentModalImageIndex(0);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    if (isModalOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, closeModal]);

  const changeCardImage = (cardId: string, direction: 'next' | 'prev', totalImages: number) => {
    setCurrentCardImageIndexes(prevIndexes => {
      const currentIndex = prevIndexes[cardId] || 0;
      let newIndex = direction === 'next' ? (currentIndex + 1) % totalImages : (currentIndex - 1 + totalImages) % totalImages;
      return { ...prevIndexes, [cardId]: newIndex };
    });
  };

  const changeModalImage = (direction: 'next' | 'prev') => {
    if (!selectedImagesForModal) return;
    setCurrentModalImageIndex(prevIndex => {
      const newIndex = direction === 'next'
        ? (prevIndex + 1) % selectedImagesForModal.length
        : (prevIndex - 1 + selectedImagesForModal.length) % selectedImagesForModal.length;
      return newIndex;
    });
  };

  if (cardsError) return <div className="error-message">Failed to load cards. (Error: {cardsError.message})</div>;
  if (!cards) return <div className="loading-message">Loading cards…</div>;

  return (
    <main>
      <div className={styles.shopImageBanner}>
        <Image
          src="/banner3.png"
          alt="GAY RETRO TCG Banner"
          layout="fill"
          objectFit="contain"
          priority
        />
      </div>

      <div className={styles.pageContentContainer}>
        <br />
        <div className="card-grid">
          {cards.map((card: CardItemType) => {
            const isInCart = cart.some(cartItem => cartItem.id === card.id && cartItem.quantity > 0);
            const currentImageIndexOnCard = currentCardImageIndexes[card.id] || 0;
            const displayImageUrl = card.image_url || card.images?.[currentImageIndexOnCard]?.url || "/placeholder.png";
            if (!displayImageUrl) {
              console.warn(`No image available for card ${card.name} (ID: ${card.id})`);
            }

            return (
              <div key={card.id} className={styles.productCard}>
                <div className={styles.productImageWrapper}>
                  {card.images.length > 1 && (
                    <button onClick={() => changeCardImage(card.id, 'prev', card.images.length)} className={`${styles.imageNavButton} ${styles.imageNavPrev}`}>&lt;</button>
                  )}
                  <div onClick={() => openModal(card.images, currentImageIndexOnCard)} className={styles.productImageContainer} role="button" tabIndex={0}>
                    <Image
                      src={displayImageUrl}
                      alt={card.name}
                      width={190}
                      height={260}
                      className={styles.productImage}
                      style={{ imageRendering: "pixelated" }}
                      priority={cards.indexOf(card) < 3}
                    />
                  </div>
                  {card.images.length > 1 && (
                    <button onClick={() => changeCardImage(card.id, 'next', card.images.length)} className={`${styles.imageNavButton} ${styles.imageNavNext}`}>&gt;</button>
                  )}
                </div>
                <div className={styles.productName}>{card.name}</div>
                <div className={styles.productPrice}>£{(card.price / 100).toFixed(2)}</div>
                <div className={styles.addToCartButtonContainer}>
                  <button
                    onClick={() => !isInCart && handleAddToCart(card)}
                    className={`shop-btn ${isInCart ? styles.inCartButtonDark : ''}`}
                    disabled={isInCart}
                  >
                    {isInCart ? "In Cart" : "Add to Cart"}
                  </button>
                  {!isInCart && addedItemId === card.id && (
                    <span className={styles.addedMessage}>Added!</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && selectedImagesForModal && selectedImagesForModal.length > 0 && (
        <div className={styles.modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseButton} onClick={closeModal}>&times;</button>
            {selectedImagesForModal.length > 1 && (
              <button onClick={() => changeModalImage('prev')} className={`${styles.imageNavButton} ${styles.modalImageNavPrev}`}>&lt;</button>
            )}
            <Image
              src={selectedImagesForModal[currentModalImageIndex].url}
              alt="Enlarged product image"
              width={600}
              height={800}
              style={{ imageRendering: "pixelated", objectFit: 'contain', maxHeight: '85vh', maxWidth: '80vw' }}
            />
            {selectedImagesForModal.length > 1 && (
              <button onClick={() => changeModalImage('next')} className={`${styles.imageNavButton} ${styles.modalImageNavNext}`}>&gt;</button>
            )}
          </div>
          <div className={styles.modalImageCounter}>{currentModalImageIndex + 1} / {selectedImagesForModal.length}</div>
        </div>
      )}

      {lastAddedCard && (
        <CartToast
          visible={showNotification}
          itemName={lastAddedCard.name}
          onHide={() => setShowNotification(false)}
        />
      )}
    </main>
  );
}
