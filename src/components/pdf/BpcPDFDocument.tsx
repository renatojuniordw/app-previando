import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles, BRAND, LOGO_BASE64 } from './styles'

interface BpcPDFDocumentProps {
  result: string
  type: 'BPC' | 'LOAS' | 'BPC/LOAS'
  generatedAt?: string
}

const Header: React.FC = () => (
  <View style={styles.header} fixed>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image src={LOGO_BASE64} style={{ width: 60, height: 18 }} />
      <View>
        <Text style={styles.headerTitle}>Análise BPC/LOAS</Text>
        <Text style={styles.headerSubtitle}>Previando — Simulador Previdenciário</Text>
      </View>
    </View>
    <Text style={{ fontSize: 7, color: BRAND.slate }}>
      app.previando.com.br
    </Text>
  </View>
)

const Footer: React.FC = () => (
  <View style={styles.footer} fixed>
    <Text>Gerado por Previando</Text>
    <Text>app.previando.com.br</Text>
  </View>
)

export function BpcPDFDocument({
  result,
  type,
  generatedAt,
}: BpcPDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Análise</Text>
          <Text style={styles.text}>{type}</Text>
        </View>

        {generatedAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data de Geração</Text>
            <Text style={styles.text}>{generatedAt}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultado da Análise</Text>
          <View style={{ padding: 8, backgroundColor: BRAND.light, borderRadius: 4, border: `0.5px solid ${BRAND.border}` }}>
            <Text style={[styles.text, { whiteSpace: 'pre-wrap' }]}>{result}</Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
