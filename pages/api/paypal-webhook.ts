// pages/api/paypal-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Required for raw body verification
  },
};

function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const rawBody = await buffer(req);
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
  const authAlgo = req.headers['paypal-auth-algo'] as string;
  const certUrl = req.headers['paypal-cert-url'] as string;
  const transmissionId = req.headers['paypal-transmission-id'] as string;
  const transmissionSig = req.headers['paypal-transmission-sig'] as string;
  const transmissionTime = req.headers['paypal-transmission-time'] as string;

  // Step 1: Validate the webhook using PayPal's API
  const accessTokenRes = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const { access_token } = await accessTokenRes.json();

  const verificationRes = await fetch(`${process.env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody.toString()),
    }),
  });

  const verification = await verificationRes.json();
  if (verification.verification_status !== 'SUCCESS') {
    console.error("Failed PayPal webhook verification:", verification);
    return res.status(400).send('Webhook verification failed');
  }

  // Step 2: Parse the event
  const event = JSON.parse(rawBody.toString());

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const customId = event.resource?.custom_id;

    if (customId) {
      const cardIds = customId.split(',');

      for (const cardId of cardIds) {
        try {
          await prisma.card.update({
            where: { id: cardId },
            data: { available: false },
          });
          console.log(`Marked card ${cardId} as unavailable`);
        } catch (error) {
          console.error(`Failed to update card ${cardId}`, error);
        }
      }
    } else {
      console.warn('No custom_id found in PayPal webhook resource');
    }
  }

  res.status(200).send('Webhook received');
}
