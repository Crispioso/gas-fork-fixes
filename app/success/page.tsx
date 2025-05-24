// app/success/page.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react'; // Added Suspense
import { useSearchParams } from 'next/navigation';
// import styles from './SuccessPage.module.css'; // Uncomment if you create this CSS Module

// Create a new component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams ? searchParams.get('session_id') : null; // Safely get sessionId
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Optional: Fetch order details based on sessionId
    // if (sessionId) {
    //   fetch(`/api/order_confirmation?session_id=${sessionId}`)
    //     .then(res => {
    //       if (!res.ok) throw new Error('Failed to fetch order details');
    //       return res.json();
    //     })
    //     .then(data => {
    //       console.log('Order data:', data);
    //       setIsLoading(false);
    //     })
    //     .catch(err => {
    //       console.error(err);
    //       setError(err.message);
    //       setIsLoading(false);
    //     });
    // } else {
    //   // If no sessionId, might indicate an issue or direct navigation
    //   // setError("No session ID found. Cannot confirm order details.");
    //   setIsLoading(false);
    // }

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading your order confirmation...</p>
        {/* You could add a spinner component here */}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Inter, sans-serif', color: 'red' }}>
        <h1>Order Confirmation Error</h1>
        <p>{error}</p>
        <Link href="/shop" style={{ display: 'inline-block', marginTop: '20px', color: '#0070f3' }}>
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Inter, sans-serif' }}>
      {/* Example: <div className={styles.container}> */}
      <h1 style={{ color: '#4CAF50', fontSize: '2.5rem', marginBottom: '20px' }}>Payment Successful!</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Thank you for your order.</p>
      <p style={{ marginBottom: '30px', color: '#555' }}>
        Your confirmation and order details will be sent to your email shortly.
        {sessionId && <><br />Your Stripe Session ID is: <code style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: '4px' }}>{sessionId}</code></>}
      </p>
      <Link href="/shop" style={{
        display: 'inline-block',
        padding: '12px 25px',
        backgroundColor: '#FF007F', // Your neon pink
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        transition: 'background-color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e00070'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF007F'}
      >
        Continue Shopping
      </Link>
    </div>
  );
}

// Wrap SuccessContent with Suspense because useSearchParams() needs it
export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Inter, sans-serif' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
