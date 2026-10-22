import { StyleSheet, Text } from 'react-native';
import { fonts } from '../theme';

/** @param {import('react-native').TextProps} props */
export default function AppText({ style, ...props }) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  const fontFamily = weight === '700' || weight === 'bold' ? fonts.bold
    : weight === '500' ? fonts.medium : fonts.regular;

  return <Text {...props} style={[style, { fontFamily, fontWeight: 'normal' }]} />;
}
