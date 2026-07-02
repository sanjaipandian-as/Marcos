export const theme = {
  name: 'MarcosThistle',
  brand: {
    50: '#faf5fa',
    100: '#f3eaf3',
    200: '#ebe0eb',
    300: '#e3d4e3',
    400: '#dcc8dc',
    500: '#D8BFD8', // Primary Vibrant Accent Thistle
    600: '#C4A4C4', // Hover/Pressed state
    700: '#ad83ad',
    800: '#8f5c8f',
    900: '#3D2E3D', // Heading text
  },
  bg: {
    main: '#F7F4F9', // App background
    card: '#FFFFFF', // Card background
    hover: '#EDE0ED', // Accent tint (badges/chips)
    banner: '#F5EEF5', // Section background
    input: '#F7F4F9',
  },
  glow: 'rgba(216, 191, 216, 0.15)',
  text: {
    primary: '#3D2E3D', // Heading text plum
    secondary: '#7A6B7A', // Body/secondary text
    muted: '#B8A8B8',
    light: '#FFFFFF',
  },
  border: '#E8D9E8', // Borders/dividers
  success: '#639922',
  warning: '#BA7517',
  error: '#E24B4A',
};

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const shadows = {
  premium: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  glow: {
    shadowColor: '#d8bfd8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
};
