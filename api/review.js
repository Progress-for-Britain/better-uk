import { callGrokReview, fetchItemText } from './_lib/review.js';

export const config = {
  maxDuration: 60, // Allow up to 60s for Grok API call (requires Vercel Pro)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protect this endpoint — only callable from our webhook or with the secret
  const secret = req.headers['x-api-secret'];
  if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { itemId, category, itemUrl } = req.body ?? {};

  if (!itemId || !category) {
    return res.status(400).json({ error: 'Missing itemId or category' });
  }

  const validCategories = ['regulations', 'ngos', 'civil-service'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    // For regulations, construct the legislation.gov.uk URL from the ID
    // IDs look like "ukpga/2020/1" → https://www.legislation.gov.uk/ukpga/2020/1
    let url = itemUrl;
    if (!url && category === 'regulations') {
      url = `https://www.legislation.gov.uk/${itemId}`;
    }

    let text;
    if (url) {
      text = await fetchItemText(url);
    }

    if (!text) {
      // For NGOs/CS or if fetch failed, use the ID as a search prompt
      text = `Please review the item with ID: ${itemId}`;
    }

    const review = await callGrokReview(category, text);

    // Return the review result
    // In production, you'd store this in a database (Vercel KV, Supabase, etc.)
    return res.status(200).json({
      success: true,
      itemId,
      category,
      review,
    });
  } catch (err) {
    console.error('Review failed:', err.message);
    return res.status(500).json({ error: 'Review failed', detail: err.message });
  }
}
