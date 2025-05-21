import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

// Declare and assign here, at the top level
const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) throw new Error("STRIPE_SECRET_KEY not set in .env")

const stripe = new Stripe(secretKey, { apiVersion: '2025-04-30.basil' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { items } = req.body // items: [{ name, price, quantity }]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'No items' })

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'gbp', // Or your preferred currency
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/shop`,
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: 'Stripe error', detail: (err as Error).message })
  }
}
