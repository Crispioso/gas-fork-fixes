// pages/api/cards.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log('Received POST request to /api/cards');
    console.log('Request body:', JSON.stringify(req.body, null, 2)); // Log the entire request body

    try {
      const { name, imageDetails, price } = req.body;

      // Log individual parts for easier debugging
      console.log('Extracted name:', name);
      console.log('Extracted imageDetails:', imageDetails);
      console.log('Extracted price:', price);
      console.log('Type of price:', typeof price);
      console.log('Is imageDetails an array?', Array.isArray(imageDetails));
      if (Array.isArray(imageDetails)) {
        console.log('Length of imageDetails:', imageDetails.length);
      }


      // Validate input
      if (!name || typeof name !== 'string' || name.trim() === "") {
        console.error('Validation failed: Invalid name.');
        return res.status(400).json({ error: 'Missing or invalid field: name is required and must be a non-empty string.' });
      }
      if (!Array.isArray(imageDetails) || imageDetails.length === 0) {
        console.error('Validation failed: imageDetails is not an array or is empty.');
        return res.status(400).json({ error: 'Missing or invalid field: imageDetails (array) is required and must not be empty.' });
      }
      if (typeof price !== 'number' || price <= 0) {
        console.error('Validation failed: Invalid price.');
        return res.status(400).json({ error: 'Missing or invalid field: price is required and must be a positive number.' });
      }

      // Validate each image detail object
      for (const detail of imageDetails) {
        if (!detail || typeof detail !== 'object') {
          console.error('Validation failed: imageDetail item is not an object.', detail);
          return res.status(400).json({ error: 'Each item in imageDetails must be an object.' });
        }
        if (!detail.url || typeof detail.url !== 'string' || detail.url.trim() === "") {
          console.error('Validation failed: imageDetail item has an invalid URL.', detail);
          return res.status(400).json({ error: 'Each image detail must have a valid, non-empty URL string.' });
        }
        // publicId is optional, so we only check its type if it exists
        if (detail.publicId !== undefined && detail.publicId !== null && typeof detail.publicId !== 'string') {
            console.error('Validation failed: imageDetail item has an invalid publicId type.', detail);
            return res.status(400).json({ error: 'If publicId is provided, it must be a string.' });
        }
      }
      console.log('Input validation passed.');

      // Create the card and its associated images in a transaction
      const newCard = await prisma.card.create({
        data: {
          name,
          price,
          images: {
            create: imageDetails.map(img => ({
              url: img.url,
              publicId: img.publicId, // Store publicId if available (Prisma will ignore if undefined and field is optional)
            })),
          },
        },
        include: {
          images: true, // Include the created images in the response
        },
      });
      console.log('New card created successfully:', newCard);
      return res.status(201).json(newCard);

    } catch (error: any) {
      console.error('Failed to create card (inside catch block):', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.code) { // Prisma errors often have a code
        console.error('Prisma error code:', error.code);
      }
      if (error.meta) { // Prisma errors might have meta details
        console.error('Prisma error meta:', error.meta);
      }
      return res.status(500).json({ error: 'Failed to create card.', details: error.message });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'GET') {
    // Your existing GET logic to fetch cards
    try {
     const cards = await prisma.card.findMany({
  where: { available: true }, // 🔥 this line filters out sold cards
  include: {
    images: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});

      return res.status(200).json(cards);
    } catch (error: any) {
      console.error('Failed to fetch cards:', error);
      return res.status(500).json({ error: 'Failed to fetch cards.', details: error.message });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
