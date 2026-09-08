import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JC Info',
    short_name: 'JC Info',
    start_url: '/',
    // 'browser' (not 'standalone') keeps Chrome/Android from treating this
    // as an installable app and showing the "Instalar" banner — this is a
    // store site, not meant to be added to the home screen as its own app.
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#17599f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
