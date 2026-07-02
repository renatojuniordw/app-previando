'use client'

import { createTheme, ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'
import CssBaseline from '@mui/material/CssBaseline'
import type { ReactNode } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    fontSize: 14,
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d97706',
            borderWidth: 2,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ef4444',
          },
        },
        input: {
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontSize: '0.875rem',
          padding: '10px 12px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#475569',
          transform: 'translate(12px, 12px) scale(1)',
          '&.Mui-focused': {
            color: '#d97706',
          },
          '&.Mui-error': {
            color: '#ef4444',
          },
          '&.MuiInputLabel-shrink': {
            transform: 'translate(12px, -8px) scale(0.75)',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontSize: '0.75rem',
          marginLeft: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        },
      },
    },
  },
})

interface Props {
  children: ReactNode
}

export function MuiThemeProvider({ children }: Props) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  )
}
