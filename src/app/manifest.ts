import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JC Info',
    short_name: 'JC Info',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#17599f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
