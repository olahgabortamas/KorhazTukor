import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KórházTükör — Magyar kórházi várólisták adatokban',
  description: 'A magyar kórházak hivatalos várólista-adatainak független, történeti követése.',
  openGraph: {
    title: 'KórházTükör',
    description: 'A magyar kórházi várólisták adatokban.',
    type: 'website',
    locale: 'hu_HU',
    images: [{
      url: 'https://raw.githubusercontent.com/olahgabortamas/KorhazTukor/main/site/public/og.png',
      width: 1731,
      height: 909,
      alt: 'KórházTükör — A magyar kórházi várólisták adatokban.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KórházTükör',
    description: 'A magyar kórházi várólisták adatokban.',
    images: ['https://raw.githubusercontent.com/olahgabortamas/KorhazTukor/main/site/public/og.png'],
  },
};

const themeScript = `
  try {
    const saved = localStorage.getItem('korhaztukor-theme');
    const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
