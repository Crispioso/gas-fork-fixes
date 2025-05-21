import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all cards, newest first
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json(cards)
  }

  if (req.method === 'POST') {
    // Create a new card
    const { name, imageUrl, price } = req.body
    if (!name || !imageUrl || typeof price !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const card = await prisma.card.create({
      data: { name, imageUrl, price }
    })
    return res.status(201).json(card)
  }

  // Any other HTTP method
  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
