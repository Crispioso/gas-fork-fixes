// app/api/paypal-webhook/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const rawBody = await req.text(); // bodyParser must be disabled for this to work
  const headers = Object.fromEntries(req.headers.entries());

  const {
    'paypal-auth-algo': authAlgo,
    'paypal-cert-url': certUrl,
    'paypal-transmission-id': transmissionId,
    'paypal-transmission-sig': transmissionSig,
    'paypal-transmission-time': transmissionTime,
  } = headers;

  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_SECRET!;
  const base = process.env.PAYPAL_API_BASE!;

  try {
    // Step 1: Get access token
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const { access_token } = await tokenRes.json();

    // Step 2: Verify webhook
    const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
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
        webhook_event: JSON.parse(rawBody),
      }),
    });

    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.error('PayPal Webhook Verification Failed:', verifyData);
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Step 3: Parse event
    const event = JSON.parse(rawBody);
    console.log("✅ PayPal Webhook Event:", event.event_type);

    if (
      event.event_type === 'PAYMENT.CAPTURE.COMPLETED' ||
      event.event_type === 'CHECKOUT.ORDER.APPROVED'
    ) {
      const customId = event.resource?.purchase_units?.[0]?.custom_id;
      if (customId) {
        const cardIds = customId.split(',');
        for (const cardId of cardIds) {
          try {
            await prisma.card.update({
              where: { id: cardId },
              data: { available: false },
            });
            console.log(`🃏 Card ${cardId} marked unavailable`);
          } catch (e) {
            console.error(`Failed to update card ${cardId}`, e);
          }
        }
      }
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}
