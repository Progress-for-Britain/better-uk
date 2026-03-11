import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary SEO */}
        <title>better-uk — Every UK regulation, charity &amp; government body, reviewed by AI</title>
        <meta
          name="description"
          content="An AI review of the entire corpus of UK legislation, leading charities, and every government department, agency, and arms-length body. Keep or delete — transparent verdicts powered by Grok."
        />
        <meta
          name="keywords"
          content="UK legislation, regulations, charities, NGOs, civil service, AI review, government reform, deregulation, arms-length bodies, Grok"
        />
        <meta name="author" content="better-uk" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://better-uk-red.vercel.app" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://better-uk-red.vercel.app" />
        <meta property="og:title" content="better-uk — Every UK regulation, charity & government body, reviewed by AI" />
        <meta
          property="og:description"
          content="An AI review of the entire corpus of UK legislation, leading charities, and every government department, agency, and arms-length body. Keep or delete — transparent verdicts powered by Grok."
        />
        <meta property="og:site_name" content="better-uk" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:image" content="https://better-uk-red.vercel.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="better-uk — UK legislation, charities & civil service reviewed by AI" />
        <meta
          name="twitter:description"
          content="An AI review of the entire corpus of UK legislation, leading charities, and every government body. Keep or delete — transparent verdicts powered by Grok."
        />
        <meta name="twitter:image" content="https://better-uk-red.vercel.app/og-image.png" />

        {/* Favicon / Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />

        {/* Theme */}
        <meta name="theme-color" content="#fafaf8" />
        <meta name="color-scheme" content="light" />
      </head>
      <body>{children}</body>
    </html>
  );
}
