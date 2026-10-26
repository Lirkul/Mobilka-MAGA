import { Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors } from '../theme';

export default function FilterRow({ label, value, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
  label: { color: colors.text, fontSize: 14, flexShrink: 0 },
  value: { color: colors.accent, fontSize: 14, textAlign: 'right', flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
