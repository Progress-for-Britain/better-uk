import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price in pence for one AI review
const REVIEW_PRICE_PENCE = 100; // £1.00

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { itemId, itemTitle, category, amountPence, quantity } = req.body ?? {};

  if (!category) {
    return res.status(400).json({ error: 'Missing category' });
  }

  const validCategories = ['regulations', 'ngos', 'civil-service'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  // Bulk funding: custom amount for N reviews
  const isBulk = typeof amountPence === 'number' && amountPence > 0;
  const unitAmount = isBulk ? REVIEW_PRICE_PENCE : REVIEW_PRICE_PENCE;
  const qty = isBulk ? Math.max(1, Math.floor(amountPence / REVIEW_PRICE_PENCE)) : 1;
  const categoryLabel = category === 'regulations' ? 'legislation' : category === 'ngos' ? 'charity/NGO' : 'civil service body';

  const productName = isBulk
    ? `Fund ${qty} AI Review${qty > 1 ? 's' : ''} (${categoryLabel})`
    : `AI Review: ${itemTitle || itemId}`;

  const successUrl = isBulk
    ? `${req.headers.origin}/?funded=${qty}`
    : `${req.headers.origin}/regulation/${encodeURIComponent(itemId)}?review=pending`;
  const cancelUrl = isBulk
    ? `${req.headers.origin}/`
    : `${req.headers.origin}/regulation/${encodeURIComponent(itemId)}?review=cancelled`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: productName,
              description: `Grok AI review of ${categoryLabel}`,
            },
            unit_amount: unitAmount,
          },
          quantity: qty,
        },
      ],
      metadata: {
        ...(itemId ? { itemId } : {}),
        category,
        quantity: String(qty),
      },
      payment_intent_data: {
        metadata: {
          ...(itemId ? { itemId } : {}),
          category,
          quantity: String(qty),
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
