import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel serverless: disable default body parsing so we can verify the raw signature
export const config = {
  api: { bodyParser: false },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { itemId, category } = session.metadata || {};

    if (itemId && category) {
      // Fire-and-forget: call the review endpoint
      // In production, you'd use a queue (e.g. Vercel KV, Upstash Redis)
      // For now, we call the review API directly
      const origin = `https://${req.headers.host}`;
      try {
        await fetch(`${origin}/api/review`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-secret': process.env.INTERNAL_API_SECRET || '',
          },
          body: JSON.stringify({
            itemId,
            category,
            sessionId: session.id,
          }),
        });
      } catch (err) {
        // Log but don't fail the webhook — Stripe would retry
        console.error('Failed to trigger review:', err.message);
      }
    }
  }

  return res.status(200).json({ received: true });
}
