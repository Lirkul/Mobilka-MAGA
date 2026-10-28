import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { readerPalette } from '../data/readerOptions';

export default function ReaderLoading({ theme = 'light' }) {
  const palette = readerPalette(theme);
  return <View accessibilityLiveRegion="polite" testID="reader-loading" style={[styles.screen, { backgroundColor: palette.paper }]}>
    <Icon name="openBook" size={88} color={palette.dark ? '#bbb' : '#83837f'} />
    <Text style={[styles.label, { color: palette.ink }]}>Готовимся к чтению</Text>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontSize: 15, lineHeight: 22 },
});
