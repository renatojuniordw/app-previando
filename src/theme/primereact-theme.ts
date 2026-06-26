// Custom PrimeReact Theme — Previando Neumorphism
// Compatible with PrimeReact v10+ (styled mode)

export const previandoTheme = {
  primitive: {
    borderRadius: {
      none: '0',
      xs:   '4px',
      sm:   '8px',
      md:   '12px',
      lg:   '14px',
      xl:   '20px',
    },
    emerald:  { 500: '#E85D30' },  // hijack to primary
    orange:   { 500: '#E85D30' },
  },
  semantic: {
    primary: {
      50:  '#F2E8E4',
      100: '#F5D0C3',
      200: '#F0B09A',
      300: '#EB8B6A',
      400: '#F0724A',
      500: '#E85D30',   // ← main coral-orange
      600: '#C44A20',
      700: '#A03A15',
      800: '#7C2B0E',
      900: '#581E08',
      950: '#341107',
    },
    colorScheme: {
      light: {
        surface: {
          0:   '#FFFFFF',
          50:  '#F8F8F8',
          100: '#F0F0F0',  // ← main surface
          200: '#E8E8E8',
          300: '#D5D5D5',
          400: '#BBBBBB',
          500: '#9E9E9E',
          600: '#777777',
          700: '#555555',
          800: '#333333',
          900: '#1A1A1A',
          950: '#0D0D0D',
        },
        primary: {
          color:          '#E85D30',
          inverseColor:   '#FFFFFF',
          hoverColor:     '#F0724A',
          activeColor:    '#C44A20',
        },
        highlight: {
          background:       '#F2E8E4',
          focusBackground:  '#F5D0C3',
          color:            '#E85D30',
          focusColor:       '#C44A20',
        },
      },
    },
  },
};
