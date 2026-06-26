import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts - Inter supports Portuguese characters
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCo3EwrCARFiPpVS6uLyb7q.woff', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCo3EwrCARFiPpVS6uLyb7q.woff', fontWeight: 'bold' },
  ],
})

// Logo as base64 for PDF embedding
const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyMjAgNDAiPjx0ZXh0IHg9IjAiIHk9IjMwIiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNkOTc3MDYiPlBSRVZJQU5ETzwvdGV4dD48bGluZSB4MT0iMCIgeTE9IjM2IiB4Mj0iMjIwIiB5Mj0iMzYiIHN0cm9rZT0iI2Q5NzcwNiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg=='

export const BRAND = {
  accent: '#d97706',
  dark: '#0f172a',
  light: '#f8fafc',
  slate: '#64748b',
  border: '#e2e8f0',
}

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Inter',
    color: BRAND.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: `2px solid ${BRAND.accent}`,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.dark,
  },
  headerSubtitle: {
    fontSize: 8,
    color: BRAND.slate,
    marginTop: 2,
  },
  logo: {
    width: 80,
    height: 24,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 7,
    color: BRAND.slate,
    borderTop: `1px solid ${BRAND.border}`,
    paddingTop: 6,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND.accent,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: `1px solid ${BRAND.border}`,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.light,
    borderBottom: `1px solid ${BRAND.border}`,
    borderTop: `1px solid ${BRAND.border}`,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `0.5px solid ${BRAND.border}`,
    paddingVertical: 3,
  },
  cell: {
    flex: 1,
    fontSize: 9,
  },
  cellLabel: {
    flex: 1.5,
    fontSize: 9,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  watermark: {
    position: 'absolute' as const,
    bottom: 40,
    right: 40,
    fontSize: 48,
    fontWeight: 'bold',
    color: 'rgba(217, 119, 6, 0.08)',
    fontFamily: 'Inter',
  },
  badge: {
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
  },
  divider: {
    borderBottom: `0.5px solid ${BRAND.border}`,
    marginBottom: 8,
    marginTop: 8,
  },
})

export { LOGO_BASE64 }
