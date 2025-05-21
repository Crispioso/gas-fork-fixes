import type { NextApiRequest, NextApiResponse } from 'next'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export const config = {
  api: { bodyParser: false }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // Parse the incoming form (raw file upload)
  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Uint8Array)
  }
  const buffer = Buffer.concat(chunks)
  // Upload to Cloudinary
  cloudinary.uploader
    .upload_stream({ folder: 'gay-reto-tcg/cards' }, (err, result) => {
      if (err || !result) return res.status(500).json({ error: err?.message || 'Upload failed' })
      res.status(200).json({ url: result.secure_url })
    })
    .end(buffer)
}
