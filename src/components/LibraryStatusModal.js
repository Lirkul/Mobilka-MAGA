import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';
import MotionSurface from './MotionSurface';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const libraryStatusLabels = {
  reading: 'Читаю',
  planned: 'Прочту позже',
  finished: 'Прочитано',
  not_interested: 'Не интересно',
};

export default function LibraryStatusModal({ visible, status, saving, error, onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  const icons = { reading: 'reading', planned: 'clock', finished: 'doubleCheck', not_interested: 'eyeOff' };
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => !saving && onClose()}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !saving && onClose()} accessibilityRole="button" accessibilityLabel="Закрыть выбор статуса" />
        <MotionSurface testID="library-status-panel" visible={visible} style={[styles.dialog, { paddingBottom: Math.max(8, insets.bottom) }]}>
          <Text accessibilityRole="header" style={styles.title}>Пометить как</Text>
          {Object.entries(libraryStatusLabels).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: value === status, disabled: saving }}
              aria-checked={value === status}
              disabled={saving}
              onPress={() => onSelect(value)}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Icon name={icons[value]} size={24} color={colors.accent} />
              <Text style={styles.label}>{label}</Text>
              {value === status && <Icon name="check" color={colors.accent} size={20} />}
            </Pressable>
          ))}
          {saving && <View style={styles.message}><ActivityIndicator color={colors.accent} /><Text style={styles.hint}>Сохраняем статус…</Text></View>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error} Выберите статус ещё раз.</Text>}
        </MotionSurface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'flex-end' },
  dialog: { width: '100%', maxWidth: 480, backgroundColor: colors.panel, paddingVertical: 8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 14 },
  pressed: { backgroundColor: colors.segment },
  radio: { width: 20, height: 20, borderWidth: 2, borderRadius: 10, borderColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  label: { color: colors.text, fontSize: 16, flex: 1 },
  message: { flexDirection: 'row', paddingHorizontal: 22, paddingTop: 12, alignItems: 'center', gap: 10 },
  hint: { color: colors.secondary, fontSize: 14 },
  error: { color: '#f3a99d', paddingHorizontal: 22, marginTop: 12, fontSize: 14, lineHeight: 20 },
  cancel: { minHeight: 48, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 24 },
  cancelText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
});
