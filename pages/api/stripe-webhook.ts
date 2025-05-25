// filepath: c:\dev\gay-reto-tcg\pages\api\stripe-webhook.ts
import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });
const prisma = new PrismaClient();

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error("❌ Missing Stripe-Signature header");
    return res.status(400).send("Missing Stripe-Signature header");
  }

  if (!webhookSecret) {
    console.error("❌ Missing STRIPE_WEBHOOK_SECRET in environment variables");
    return res.status(500).send("Server misconfigured: missing Stripe webhook secret");
  }

  const buf = await buffer(req);
  let event: Stripe.Event;
  
console.log("🔐 Using secret:", process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 12)); // just the first part

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Invalid Stripe signature:", (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  console.log("✅ Received event:", event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const cardIds = session.metadata?.cardIds?.split(',') || [];

    console.log("📦 cardIds from metadata:", cardIds);

    for (const cardId of cardIds) {
      try {
        const updatedCard = await prisma.card.update({
          where: { id: cardId },
          data: { available: false },
        });
        console.log(`✅ Card ${cardId} marked as unavailable:`, updatedCard.id);
      } catch (error: any) {
        console.error(`❌ Failed to update card ${cardId}`, {
          code: error.code,
          message: error.message,
        });
      }
    }
  }

  res.status(200).json({ received: true });
}
