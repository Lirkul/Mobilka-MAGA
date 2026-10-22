import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { colors } from '../theme';

export default function ReaderSettingsModal({ visible, value, onChange, onClose, error }) {
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть настройки чтения" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.panel}>
        <Text style={styles.title}>Настройки чтения</Text>
        <View style={styles.row}><Text style={styles.label}>Размер шрифта: {value.fontSize}</Text><Pressable accessibilityRole="button" accessibilityLabel="Уменьшить шрифт" disabled={value.fontSize <= 14} onPress={() => onChange({ ...value, fontSize: Math.max(14, value.fontSize - 2) })} style={styles.button}><Text style={styles.label}>A−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Увеличить шрифт" disabled={value.fontSize >= 28} onPress={() => onChange({ ...value, fontSize: Math.min(28, value.fontSize + 2) })} style={styles.button}><Text style={styles.label}>A+</Text></Pressable></View>
        <View style={styles.row}>{[['light', 'Светлая'], ['dark', 'Тёмная']].map(([theme, title]) => <Pressable key={theme} accessibilityRole="radio" aria-checked={value.theme === theme} accessibilityState={{ checked: value.theme === theme }} onPress={() => onChange({ ...value, theme })} style={[styles.button, value.theme === theme && styles.active]}><Text style={styles.label}>{title}</Text></Pressable>)}</View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}><Text style={styles.label}>ГОТОВО</Text></Pressable>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: { backgroundColor: colors.panel, width: '100%', maxWidth: 480, padding: 20, paddingBottom: 32, gap: 20 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  label: { color: colors.text, fontSize: 14 }, button: { minHeight: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  active: { borderColor: colors.accent, backgroundColor: '#385368' }, done: { alignSelf: 'flex-end', padding: 12, minHeight: 44 }, error: { color: '#f3a99d' },
});
