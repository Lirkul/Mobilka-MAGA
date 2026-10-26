import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { colors } from '../theme';
import Icon from './Icon';

export default function ReaderSettingsModal({ visible, value, onChange, onClose, error }) {
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть настройки чтения" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.panel} accessibilityViewIsModal>
        <View style={styles.handle} />
        <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Настройки чтения</Text><Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} style={styles.close}><Icon name="close" color={colors.accent} size={20} /></Pressable></View>
        <View style={styles.row}><Text style={styles.fontName}>Roboto</Text><Text style={styles.fontHint}>Шрифт книги</Text></View>
        <View style={styles.row}><Text style={styles.label}>Размер шрифта: {value.fontSize}</Text><Pressable accessibilityRole="button" accessibilityLabel="Уменьшить шрифт" disabled={value.fontSize <= 14} onPress={() => onChange({ ...value, fontSize: Math.max(14, value.fontSize - 2) })} style={styles.button}><Text style={styles.label}>A−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Увеличить шрифт" disabled={value.fontSize >= 28} onPress={() => onChange({ ...value, fontSize: Math.min(28, value.fontSize + 2) })} style={styles.button}><Text style={styles.label}>A+</Text></Pressable></View>
        <View style={styles.row}>{[['light', 'Светлая'], ['dark', 'Тёмная']].map(([theme, title]) => <Pressable key={theme} accessibilityRole="radio" accessibilityLabel={title} aria-checked={value.theme === theme} accessibilityState={{ checked: value.theme === theme }} onPress={() => onChange({ ...value, theme })} style={[styles.themeButton, value.theme === theme && styles.active]}><View style={[styles.swatch, { backgroundColor: theme === 'light' ? '#f9f8f2' : '#232323' }]}><Text style={{ color: theme === 'light' ? '#484844' : '#e6e6e6', fontSize: 23 }}>A</Text></View><Text style={styles.label}>{title}</Text></Pressable>)}</View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}><Text style={styles.label}>ГОТОВО</Text></Pressable>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: { backgroundColor: '#ffffff', width: '100%', maxWidth: 480, padding: 20, paddingTop: 10, paddingBottom: 24, gap: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  handle: { width: 36, height: 3, borderRadius: 2, backgroundColor: '#d5d8db', alignSelf: 'center' }, heading: { flexDirection: 'row', alignItems: 'center' }, close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#484844', fontSize: 18, fontWeight: '700', flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  fontName: { color: '#484844', fontSize: 18 }, fontHint: { color: '#92989c', fontSize: 12, marginLeft: 'auto' },
  label: { color: '#484844', fontSize: 14 }, button: { minHeight: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: '#b6c9d6', alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  themeButton: { minHeight: 72, flex: 1, borderWidth: 1, borderColor: '#d2d8db', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#b9c2c8', alignItems: 'center', justifyContent: 'center' },
  active: { borderColor: colors.accent, backgroundColor: '#eef5f9' }, done: { alignSelf: 'flex-end', padding: 12, minHeight: 44 }, error: { color: '#b85f57' },
});
