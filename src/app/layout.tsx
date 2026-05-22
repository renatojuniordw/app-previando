import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  )
}
