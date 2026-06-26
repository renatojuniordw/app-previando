import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { PrimeReactProvider } from './PrimeReactProvider'
import 'primereact/resources/themes/lara-light-amber/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
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

export const metadata: Metadata = {
  title: 'Previando — Previdência inteligente para advogados',
  description:
    'Calcule benefícios do INSS, gerencie casos e gere pareceres com IA. Para advogados previdenciários.',
  metadataBase: new URL('https://app.previando.com.br'),
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
      <body>
        <PrimeReactProvider>{children}</PrimeReactProvider>
      </body>
    </html>
  )
}
