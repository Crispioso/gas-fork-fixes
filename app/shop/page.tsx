// app/shop/page.tsx
"use client";
import { useCart } from "@/components/CartProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from '../styles/ShopPage.module.css';
import { useState, useEffect, useCallback } from "react"; // Added useCallback
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
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ShopPage() {
  const { data: cards, error: cardsError } = useSWR<CardItemType[]>("/api/cards", fetcher);
  const { cart, addToCart } = useCart();
  const router = useRouter();

  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  
  // State for modal
  const [selectedImagesForModal, setSelectedImagesForModal] = useState<ImageType[] | null>(null);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State to track current image index for each card on the shop page
  const [currentCardImageIndexes, setCurrentCardImageIndexes] = useState<{ [cardId: string]: number }>({});

  const handleAddToCart = (card: CardItemType) => {
    const currentImageIndex = currentCardImageIndexes[card.id] || 0;
    const itemToAdd = {
        ...card,
        imageUrl: card.images && card.images.length > 0 ? card.images[currentImageIndex].url : "/placeholder.png"
    };
    const itemAlreadyInCart = cart.some(cartItem => cartItem.id === card.id);
    if (!itemAlreadyInCart) {
      addToCart(itemToAdd);
      setAddedItemId(card.id);
      setTimeout(() => {
        setAddedItemId(null);
      }, 2000);
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
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen, closeModal]);

  const changeCardImage = (cardId: string, direction: 'next' | 'prev', totalImages: number) => {
    setCurrentCardImageIndexes(prevIndexes => {
      const currentIndex = prevIndexes[cardId] || 0;
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % totalImages;
      } else {
        newIndex = (currentIndex - 1 + totalImages) % totalImages;
      }
      return { ...prevIndexes, [cardId]: newIndex };
    });
  };
  
  const changeModalImage = (direction: 'next' | 'prev') => {
    if (!selectedImagesForModal) return;
    setCurrentModalImageIndex(prevIndex => {
      let newIndex;
      if (direction === 'next') {
        newIndex = (prevIndex + 1) % selectedImagesForModal.length;
      } else {
        newIndex = (prevIndex - 1 + selectedImagesForModal.length) % selectedImagesForModal.length;
      }
      return newIndex;
    });
  };


  if (cardsError) return <div className="error-message">Failed to load cards. (Error: {cardsError.message})</div>;
  if (!cards) return <div className="loading-message">Loading cards…</div>;

  const shopTitleClass = "shop-title";
  const cardGridClass = "card-grid";
  const addToCartButtonClass = "shop-btn";

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
        <div className={cardGridClass}>
          {cards.map((card: CardItemType) => {
            const isInCart = cart.some(cartItem => cartItem.id === card.id && cartItem.quantity > 0);
            const currentImageIndexOnCard = currentCardImageIndexes[card.id] || 0;
            const displayImageUrl = card.images && card.images.length > 0 ? card.images[currentImageIndexOnCard].url : "/placeholder.png";

            return (
              <div key={card.id} className={styles.productCard}>
                <div className={styles.productImageWrapper}> {/* New wrapper for image and nav buttons */}
                  {card.images && card.images.length > 1 && (
                    <button
                      onClick={() => changeCardImage(card.id, 'prev', card.images.length)}
                      className={`${styles.imageNavButton} ${styles.imageNavPrev}`}
                      aria-label="Previous image"
                    >
                      &lt;
                    </button>
                  )}
                  <div
                    onClick={() => openModal(card.images, currentImageIndexOnCard)}
                    className={styles.productImageContainer}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(card.images, currentImageIndexOnCard)}}
                  >
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
                  {card.images && card.images.length > 1 && (
                    <button
                      onClick={() => changeCardImage(card.id, 'next', card.images.length)}
                      className={`${styles.imageNavButton} ${styles.imageNavNext}`}
                      aria-label="Next image"
                    >
                      &gt;
                    </button>
                  )}
                </div>
                <div className={styles.productName}>
                  {card.name}
                </div>
                <div className={styles.productPrice}>
                  £{(card.price / 100).toFixed(2)}
                </div>
                <div className={styles.addToCartButtonContainer}>
                  <button
                    onClick={() => !isInCart && handleAddToCart(card)}
                    className={`${addToCartButtonClass} ${isInCart ? styles.inCartButtonDark : ''}`}
                    disabled={isInCart}
                  >
                    {isInCart ? "In Cart" : "Add to Cart"}
                  </button>
                  {!isInCart && addedItemId === card.id && (
                    <span className={styles.addedMessage}>
                      Added!
                    </span>
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
            <button className={styles.modalCloseButton} onClick={closeModal} aria-label="Close image viewer">
              &times;
            </button>
            {selectedImagesForModal.length > 1 && (
                 <button
                    onClick={() => changeModalImage('prev')}
                    className={`${styles.imageNavButton} ${styles.modalImageNavPrev}`}
                    aria-label="Previous image in modal"
                >
                    &lt;
                </button>
            )}
            <Image
              src={selectedImagesForModal[currentModalImageIndex].url}
              alt="Enlarged product image"
              width={600}
              height={800}
              style={{ imageRendering: "pixelated", objectFit: 'contain', maxHeight: '85vh', maxWidth: '80vw' }}
            />
            {selectedImagesForModal.length > 1 && (
                 <button
                    onClick={() => changeModalImage('next')}
                    className={`${styles.imageNavButton} ${styles.modalImageNavNext}`}
                    aria-label="Next image in modal"
                >
                    &gt;
                </button>
            )}
          </div>
           {selectedImagesForModal.length > 1 && (
            <div className={styles.modalImageCounter}>
                {currentModalImageIndex + 1} / {selectedImagesForModal.length}
            </div>
            )}
        </div>
      )}
    </main>
  );
}
