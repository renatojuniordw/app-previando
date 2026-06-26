import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { styles, BRAND, LOGO_BASE64 } from './styles'

interface CasePDFDocumentProps {
  clientName?: string
  clientCpf?: string
  clientBirthDate?: string
  clientDeathDate?: string
  clientMaritalStatus?: string
  clientSurvivors?: string
  selectedCalculation?: {
    type: string
    value: string
    details: Record<string, string | number>
  }
  opinion?: string
  caseStatus?: string
  createdAt?: string
  watermark?: boolean
}

const Header: React.FC = () => (
  <View style={styles.header} fixed>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image src={LOGO_BASE64} style={{ width: 60, height: 18 }} />
      <View>
        <Text style={styles.headerTitle}>Relatório do Caso</Text>
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

const DataRow: React.FC<{ label: string; value: string; flex?: number }> = ({ label, value, flex = 1 }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.cellLabel, { flex: 1.5 }]}>{label}</Text>
    <Text style={[styles.cell, { flex }]}>
      {value || '—'}
    </Text>
  </View>
)

export function CasePDFDocument({
  clientName,
  clientCpf,
  clientBirthDate,
  clientDeathDate,
  clientMaritalStatus,
  clientSurvivors,
  selectedCalculation,
  opinion,
  caseStatus,
  createdAt,
  watermark = false,
}: CasePDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header />

        {/* Client Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 1.5 }]}>Campo</Text>
            <Text style={styles.cell}>Valor</Text>
          </View>
          <DataRow label="Nome" value={clientName || ''} />
          <DataRow label="CPF" value={clientCpf || ''} />
          <DataRow label="Data de Nascimento" value={clientBirthDate || ''} />
          {clientDeathDate && <DataRow label="Data de Óbito" value={clientDeathDate} />}
          <DataRow label="Estado Civil" value={clientMaritalStatus || ''} />
          {clientSurvivors && <DataRow label="Dependentes" value={clientSurvivors} flex={2} />}
        </View>

        {/* Case Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Caso</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 1.5 }]}>Campo</Text>
            <Text style={styles.cell}>Valor</Text>
          </View>
          <DataRow label="Status" value={caseStatus || ''} />
          <DataRow label="Data de Criação" value={createdAt || ''} />
        </View>

        {/* Calculation Section */}
        {selectedCalculation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cálculo Selecionado</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, { flex: 1.5 }]}>Campo</Text>
              <Text style={styles.cell}>Valor</Text>
            </View>
            <DataRow label="Tipo" value={selectedCalculation.type} />
            <DataRow label="Valor" value={selectedCalculation.value} />
            {Object.entries(selectedCalculation.details).map(([key, val]) => (
              <DataRow key={key} label={key} value={String(val)} />
            ))}
          </View>
        )}

        {/* Opinion Section */}
        {opinion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parecer Jurídico</Text>
            <View style={{ padding: 8, backgroundColor: BRAND.light, borderRadius: 4, border: `0.5px solid ${BRAND.border}` }}>
              <Text style={styles.text}>{opinion}</Text>
            </View>
          </View>
        )}

        {watermark && <Text style={styles.watermark}>PREVIANDO FREE</Text>}

        <Footer />
      </Page>
    </Document>
  )
}
