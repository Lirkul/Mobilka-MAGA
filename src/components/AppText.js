import { StyleSheet, Text } from 'react-native';
import { fonts } from '../theme';

/** @param {import('react-native').TextProps} props */
export default function AppText({ style, ...props }) {
  const resolved = StyleSheet.flatten(style);
  const weight = resolved?.fontWeight;
  const fontFamily = resolved?.fontFamily || (weight === '700' || weight === 'bold' ? fonts.bold
    : weight === '500' ? fonts.medium : fonts.regular);

  return <Text {...props} style={[style, { fontFamily, fontWeight: 'normal' }]} />;
}
