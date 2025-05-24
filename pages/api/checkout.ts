import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Top-level declaration for the secret key
const secretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Check for STRIPE_SECRET_KEY at the beginning of the handler
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set or not available at runtime.");
    return res.status(500).json({ error: 'Server configuration error: Stripe key missing.' });
  }

  // Initialize Stripe SDK here, inside the handler, after confirming the key
  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil', // Use a recent stable API version
    typescript: true, // Recommended for TypeScript projects
  });

  const { lineItems } = req.body;

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty lineItems provided.' });
  }

  for (const item of lineItems) {
    if (
      !item.price_data ||
      !item.price_data.currency ||
      !item.price_data.product_data ||
      !item.price_data.product_data.name ||
      typeof item.price_data.unit_amount !== 'number' ||
      typeof item.quantity !== 'number' || item.quantity < 1
    ) {
      console.error('Invalid line item structure:', item);
      return res.status(400).json({ error: 'One or more line items have an invalid structure.' });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cart`,
    });

    if (session.url) {
      res.status(200).json({ url: session.url });
    } else {
      console.error("Stripe session created but no URL was returned.");
      res.status(500).json({ error: 'Failed to create checkout session: No URL returned.' });
    }
  } catch (err) {
    const error = err as Stripe.errors.StripeError;
    console.error('Stripe API Error:', error.message, 'Code:', error.code);
    res.status(500).json({
      error: 'Stripe error',
      detail: error.message || 'An unexpected error occurred with Stripe.',
      code: error.code,
    });
  }
}
