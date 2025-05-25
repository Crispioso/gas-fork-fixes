// app/cart/page.tsx
"use client";
import { useCart } from "@/components/CartProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from '../styles/CartPage.module.css'; // Adjust path if you place it in app/styles/

const MINIMUM_SPEND_PENCE = 30; // Stripe's minimum is 30p for GBP

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  const calculateTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  const totalPrice = calculateTotalPrice();
  const isBelowMinimumSpend = totalPrice < MINIMUM_SPEND_PENCE;

  async function handleCheckout() {
    if (isBelowMinimumSpend) {
      // This alert is a fallback, the button should be disabled.
      alert(`Minimum spend is £${(MINIMUM_SPEND_PENCE / 100).toFixed(2)}.`);
      return;
    }

    const lineItems = cart.map(item => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
          images: [item.imageUrl],
        },
        unit_amount: item.price, // Price in pence
      },
      quantity: item.quantity,
      cardId: item.id,
    }));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems }),
      });
      const { url } = await res.json();
      if (url) {
        router.push(url);
      } else {
        alert("Failed to create checkout session.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred during checkout.");
    }
  }

  if (cart.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyCartContainer}>
          <h1 className={styles.emptyCartTitle}>Your Cart is Empty</h1>
          <p className={styles.emptyCartText}>Looks like you haven't added anything to your cart yet.</p>
          <button
            onClick={() => router.push("/shop")}
            className={styles.goToShopButton}
          >
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Your Shopping Cart</h1>
      <div className={styles.cartItemsList}>
        {cart.map(item => (
          <div
            key={item.id}
            className={styles.cartItem}
          >
            <div className={styles.itemDetails}>
              <Image
                src={item.imageUrl || "/placeholder.png"} 
                alt={item.name}
                width={80}
                height={110}
                className={styles.itemImage}
                style={{ imageRendering: "pixelated" }}
              />
              <div>
                <h2 className={styles.itemName}>{item.name}</h2>
                <p className={styles.itemPrice}>
                  Price: £{(item.price / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <div className={styles.itemActions}>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className={styles.quantityButton}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>
                <span className={styles.quantityDisplay}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className={styles.quantityButton}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
              <p className={styles.itemTotalPrice}>
                £{((item.price * item.quantity) / 100).toFixed(2)}
              </p>
              <button
                onClick={() => removeFromCart(item.id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.cartSummary}>
        <h2 className={styles.summaryTitle}>Cart Summary</h2>
        <div className={styles.summaryRow}>
          <p className={styles.summaryLabel}>Subtotal:</p>
          <p className={styles.summaryValue}>£{(totalPrice / 100).toFixed(2)}</p>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotalRow}`}>
          <p className={styles.summaryTotalLabel}>Total:</p>
          <p className={styles.summaryTotalValue}>£{(totalPrice / 100).toFixed(2)}</p>
        </div>
        {isBelowMinimumSpend && (
          <div className={styles.minimumSpendMessage}>
            Your order total is below the minimum of £{(MINIMUM_SPEND_PENCE / 100).toFixed(2)} required for checkout.
          </div>
        )}
        <button
          onClick={handleCheckout}
          className={styles.checkoutButton}
          disabled={isBelowMinimumSpend} 
        >
          Proceed to Checkout
        </button>
        <button
          onClick={clearCart}
          className={styles.clearCartButton}
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}
