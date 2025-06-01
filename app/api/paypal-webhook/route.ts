// app/api/paypal-webhook/route.ts
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);

    const headers = {
      authAlgo: req.headers.get('paypal-auth-algo'),
      certUrl: req.headers.get('paypal-cert-url'),
      transmissionId: req.headers.get('paypal-transmission-id'),
      transmissionSig: req.headers.get('paypal-transmission-sig'),
      transmissionTime: req.headers.get('paypal-transmission-time'),
    };

    const missing = Object.entries(headers).filter(([_, v]) => !v);
    if (missing.length > 0) {
      console.error("Missing PayPal headers:", missing.map(([k]) => k).join(', '));
      return new Response("Missing headers", { status: 400 });
    }

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const apiBase = process.env.PAYPAL_API_BASE;

    if (!webhookId || !clientId || !secret || !apiBase) {
      console.error("Missing PayPal env vars");
      return new Response("Server misconfigured", { status: 500 });
    }

    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Failed to get access token:", tokenData);
      return new Response("Failed to get access token", { status: 500 });
    }

    const event = JSON.parse(bodyBuffer.toString());

    const verifyRes = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });

    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.error("❌ Webhook not verified:", verifyData);
      return new Response("Webhook verification failed", { status: 400 });
    }

    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const customId = event.resource?.purchase_units?.[0]?.custom_id;
      if (!customId) {
        console.warn("Missing custom_id in webhook");
        return new Response("Missing custom_id", { status: 400 });
      }

      const cardIds = customId.split(',');

      for (const cardId of cardIds) {
        try {
          await prisma.card.update({
            where: { id: cardId },
            data: { available: false },
          });
          console.log(`✅ Card ${cardId} marked as unavailable`);
        } catch (err) {
          console.error(`❌ DB update failed for card ${cardId}`, err);
        }
      }
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("💥 Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
