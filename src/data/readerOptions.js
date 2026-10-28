export const readerThemes = [
  { value: 'white', label: 'Белая', paper: '#f8f8fa', ink: '#464644', dark: false },
  { value: 'light', label: 'Светлая', paper: '#faf8ef', ink: '#484844', dark: false },
  { value: 'sepia', label: 'Сепия', paper: '#d1c8a4', ink: '#3e3a31', dark: false },
  { value: 'dark', label: 'Тёмная', paper: '#4a4a4a', ink: '#eeeeea', dark: true },
  { value: 'black', label: 'Чёрная', paper: '#080808', ink: '#bfbfbf', dark: true },
];
export const readerFonts = [
  { value: 'roboto', label: 'Roboto' },
  { value: 'system', label: 'Системный' },
  { value: 'serif', label: 'С засечками' },
  { value: 'mono', label: 'Моноширинный' },
];
export const defaultReaderSettings = {
  fontSize: 18, theme: 'light', font: 'roboto', alignment: 'justify', readingMode: 'scroll',
  brightness: 85, autoBrightness: true, brightnessGestures: false,
  lineHeight: 1.45, paragraphSpacing: 12, horizontalPadding: 10,
};
export const readerPalette = theme => readerThemes.find(item => item.value === theme) || readerThemes[1];
