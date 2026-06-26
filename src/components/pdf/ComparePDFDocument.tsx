import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles, BRAND, LOGO_BASE64 } from './styles'

interface ModalidadeSugerida {
  modalidade: string
  gender: 'M' | 'F'
  elegivel: boolean
  rmi: number
  coeficiente: number
  tempoContribuicaoAnos: number
  pendencias: string[]
}

interface ComparePDFDocumentProps {
  elegiveis: ModalidadeSugerida[]
  naoElegiveis: ModalidadeSugerida[]
}

const MODALITY_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Apos. por Idade',
  TEMPO_CONTRIBUICAO: 'Tempo de Contribuição',
  PONTOS_86_96: 'Pontos (86/96)',
  PEDAGIO_50: 'Pedágio 50%',
  PEDAGIO_100: 'Pedágio 100%',
  APOSENTADORIA_ESPECIAL: 'Especial',
  HIBRIDA: 'Híbrida',
  IDADE_MINIMA_65_62: 'Idade Mínima 65/62',
  AUXILIO_DOENCA_B31: 'Auxílio-Doença B31',
  PENSAO_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
}

const GENDER_LABEL: Record<string, string> = { M: 'Masc.', F: 'Fem.' }

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const Header: React.FC = () => (
  <View style={styles.header} fixed>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image src={LOGO_BASE64} style={{ width: 60, height: 18 }} />
      <View>
        <Text style={styles.headerTitle}>Comparativo de Modalidades</Text>
        <Text style={styles.headerSubtitle}>Previando — Simulador Previdenciário</Text>
      </View>
    </View>
    <Text style={{ fontSize: 7, color: BRAND.slate }}>
      app.previando.com.br
    </Text>
  </View>
)

const Footer: React.FC<{ pageNumber: number; totalPages: number }> = ({ pageNumber, totalPages }) => (
  <View style={styles.footer} fixed>
    <Text>Gerado por Previando</Text>
    <Text>Página {pageNumber} de {totalPages}</Text>
  </View>
)

const ModalityRow: React.FC<{ item: ModalidadeSugerida }> = ({ item }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.cell, { flex: 2.5 }]}>
      {MODALITY_LABELS[item.modalidade] || item.modalidade}
    </Text>
    <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>
      {GENDER_LABEL[item.gender] || item.gender}
    </Text>
    <Text style={[styles.cell, { flex: 1.2, textAlign: 'right' }]}>
      {formatCurrency(item.rmi)}
    </Text>
    <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
      {item.coeficiente}%
    </Text>
    <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
      {item.tempoContribuicaoAnos}a
    </Text>
    <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>
      {item.pendencias.length > 0 ? `${item.pendencias.length} pend.` : '—'}
    </Text>
  </View>
)

export function ComparePDFDocument({
  elegiveis,
  naoElegiveis,
}: ComparePDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header />

        {/* Elegíveis Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Modalidades Elegíveis ({elegiveis.length})
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2.5 }]}>Modalidade</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>Sexo</Text>
            <Text style={[styles.cell, { flex: 1.2, textAlign: 'right' }]}>RMI</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Coef.</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Tempo</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>Pend.</Text>
          </View>
          {elegiveis.map((item, i) => (
            <ModalityRow key={`e-${i}`} item={item} />
          ))}
        </View>

        {/* Não Elegíveis Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Modalidades Não Elegíveis ({naoElegiveis.length})
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2.5 }]}>Modalidade</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>Sexo</Text>
            <Text style={[styles.cell, { flex: 1.2, textAlign: 'right' }]}>RMI</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Coef.</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Tempo</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>Pend.</Text>
          </View>
          {naoElegiveis.map((item, i) => (
            <ModalityRow key={`ne-${i}`} item={item} />
          ))}
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
