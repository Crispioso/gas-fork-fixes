import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set or not available at runtime.");
    return res.status(500).json({ error: 'Server configuration error: Stripe key missing.' });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil',
    typescript: true,
  });

  let { lineItems } = req.body; // Use let so we can modify it

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
      typeof item.quantity !== 'number' || item.quantity < 1 ||
      !item.cardId // Ensure cardId is present
    ) {
      console.error('Invalid line item structure:', item);
      return res.status(400).json({ error: 'One or more line items have an invalid structure or missing cardId.' });
    }
  }

  try {
    // Collect card IDs from line items
    const cardIds = lineItems.map(item => item.cardId).join(',');

    // Remove cardId from lineItems before sending to Stripe
    const stripeLineItems = lineItems.map(({ cardId, ...item }) => item);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: stripeLineItems, // Use the modified line items
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cart`,
      metadata: {
        cardIds, // e.g., "abc123,def456"
      },
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