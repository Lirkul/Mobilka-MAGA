import { Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

export default function MenuRow({ label, icon, onPress, expanded = undefined, nested = false, separated = false, badge = null }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} aria-expanded={expanded} accessibilityState={expanded === undefined ? {} : { expanded }} onPress={onPress} style={({ pressed }) => [styles.row, nested && styles.nested, separated && styles.separated, pressed && styles.pressed]}>
    <Icon name={icon} size={24} color={colors.secondary} />
    <Text style={styles.label}>{label}</Text>
    {badge !== null && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
    {expanded !== undefined && <View style={styles.chevron}><Icon name={expanded ? 'down' : 'right'} size={18} /></View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { minHeight: 52, paddingHorizontal: 16, gap: 16, flexDirection: 'row', alignItems: 'center' },
  nested: { paddingLeft: 50, gap: 14 },
  separated: { borderTopWidth: 1, borderColor: '#5b5c5e' },
  pressed: { backgroundColor: '#323336' },
  label: { color: colors.text, fontSize: 15, lineHeight: 20, flexShrink: 1 },
  chevron: { marginLeft: 'auto' },
  badge: { backgroundColor: '#7db84b', paddingHorizontal: 7, minWidth: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  badgeText: { color: '#fff', fontSize: 15 },
});
