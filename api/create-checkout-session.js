import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price in pence for one AI review
const REVIEW_PRICE_PENCE = 100; // £1.00

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, amountPence } = req.body ?? {};

  if (!category) {
    return res.status(400).json({ error: 'Missing category' });
  }

  const validCategories = ['regulations', 'ngos', 'civil-service'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  if (typeof amountPence !== 'number' || amountPence < REVIEW_PRICE_PENCE) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const qty = Math.max(1, Math.floor(amountPence / REVIEW_PRICE_PENCE));
  const categoryLabel = category === 'regulations' ? 'legislation' : category === 'ngos' ? 'charity/NGO' : 'civil service body';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Fund ${qty} AI Review${qty > 1 ? 's' : ''} (${categoryLabel})`,
              description: `Grok AI review of ${categoryLabel}`,
            },
            unit_amount: REVIEW_PRICE_PENCE,
          },
          quantity: qty,
        },
      ],
      metadata: { category, quantity: String(qty) },
      success_url: `${req.headers.origin}/?funded=${qty}`,
      cancel_url: `${req.headers.origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
