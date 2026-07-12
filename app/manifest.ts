import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeatX SaaS - Agenda & Booking',
    short_name: 'NeatX',
    description: 'Il gestionale per il tuo tempo. Zero No-Show.',
    start_url: '/registrazione',
    display: 'standalone',
    background_color: '#050814',
    theme_color: '#00b4ff',
    icons: [
      {
        src: '/icon.png',   // icon.png disponibile in app/icon.png
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
