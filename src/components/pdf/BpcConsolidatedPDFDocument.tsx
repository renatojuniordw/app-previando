import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles, BRAND, LOGO_BASE64 } from './styles'

interface BpcSection {
  type: string
  label: string
  content: string
}

interface BpcConsolidatedPDFDocumentProps {
  sections: BpcSection[]
  generatedAt?: string
}

const Header: React.FC = () => (
  <View style={styles.header} fixed>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image src={LOGO_BASE64} style={{ width: 60, height: 18 }} alt="" />
      <View>
        <Text style={styles.headerTitle}>Relatório BPC/LOAS — Completo</Text>
        <Text style={styles.headerSubtitle}>Previando — Simulador Previdenciário</Text>
      </View>
    </View>
    <Text style={{ fontSize: 7, color: BRAND.slate }}>app.previando.com.br</Text>
  </View>
)

const Footer: React.FC = () => (
  <View style={styles.footer} fixed>
    <Text>Gerado por Previando</Text>
    <Text>app.previando.com.br</Text>
  </View>
)

export function BpcConsolidatedPDFDocument({ sections, generatedAt }: BpcConsolidatedPDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header />

        {generatedAt && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 8, color: BRAND.slate }}>Gerado em: {generatedAt}</Text>
          </View>
        )}

        {sections.map((section, i) => (
          <View key={section.type} style={{ marginBottom: 20 }} break={i > 0}>
            <View style={{
              backgroundColor: BRAND.accent,
              borderRadius: 3,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#ffffff' }}>
                {section.label.toUpperCase()}
              </Text>
            </View>
            <View style={{
              padding: 10,
              backgroundColor: BRAND.light,
              borderRadius: 4,
              border: `0.5px solid ${BRAND.border}`,
            }}>
              <Text style={styles.text}>{section.content}</Text>
            </View>
          </View>
        ))}

        <View style={{
          marginTop: 16,
          padding: 8,
          borderRadius: 4,
          border: `0.5px solid #fbbf24`,
          backgroundColor: '#fffbeb',
        }}>
          <Text style={{ fontSize: 7, color: '#92400e' }}>
            Gerado por IA — não substitui análise jurídica profissional. Responsabilidade exclusiva do advogado.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
