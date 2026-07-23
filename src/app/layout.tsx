import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { MuiThemeProvider } from '@/components/ui/MuiThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#d97706',
}

export const metadata: Metadata = {
  title: 'Previando — Previdência inteligente para advogados',
  description:
    'Calcule benefícios do INSS, gerencie casos e gere pareceres com IA. Para advogados previdenciários.',
  metadataBase: new URL('https://app.previando.com.br'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Previando',
  },
  openGraph: {
    title: 'Previando',
    description: 'Previdência inteligente para advogados',
    siteName: 'Previando',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d97706" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" /><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <meta name="apple-mobile-web-app-title" content="Previando" />
      </head>
      <body className="font-sans">
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </body>
    </html>
  )
}
