// Theme & typography tokens for Crossword Master

const Theme = {
  bg: '#F8F8F8',
  surface: '#FFFFFF',

  // Grid - Gap border technique with visual separation
  gridOuterBorder: '#000000',
  gridLineColor: '#555555',
  gridBorderWidth: 4,
  gridGap: 1,

  cellBg: '#FFFFFF',
  cellBlack: '#000000',
  cellActive: '#FFD700',
  cellActiveWord: '#FFF9C4',

  text: '#000000',
  textSecondary: '#333333',
  textTertiary: '#666666',
  textOnDark: '#FFFFFF',

  blue: '#1976D2',
  green: '#388E3C',
  orange: '#F57C00',
  cellHintFlash: '#42A5F5',
  cellError: '#FFCDD2',

  clueBarBg: '#EEEEEE',
  clueBarBorder: '#CCCCCC',

  keyBg: '#FFFFFF',
  keyPressed: '#BDBDBD',
  keySpecial: '#9E9E9E',
  keyboardBg: '#D1D3D9',
  keyShadow: 'rgba(0,0,0,0.3)'
}

const Font = {
  title: 'bold 24px -apple-system, sans-serif',
  headline: '600 17px -apple-system, sans-serif',
  body: '400 16px -apple-system, sans-serif',
  subhead: '400 14px -apple-system, sans-serif',
  caption: '400 12px -apple-system, sans-serif',
  key: '500 22px -apple-system, sans-serif',
  gridLetter: (s) => `bold ${Math.floor(s * 0.55)}px Arial, sans-serif`,
  gridNumber: () => '400 10px Arial, sans-serif'
}

module.exports = { Theme, Font }
