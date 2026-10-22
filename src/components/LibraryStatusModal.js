import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

export const libraryStatusLabels = {
  reading: 'Читаю',
  planned: 'Прочту позже',
  finished: 'Прочитано',
  not_interested: 'Не интересно',
};

export default function LibraryStatusModal({ visible, status, saving, error, onSelect, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => !saving && onClose()}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !saving && onClose()} accessibilityRole="button" accessibilityLabel="Закрыть выбор статуса" />
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>В библиотеку</Text>
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
              <View style={[styles.radio, status === value && styles.selected]}>
                {status === value && <View style={styles.dot} />}
              </View>
              <Text style={styles.label}>{label}</Text>
              {value === status && <Icon name="check" color={colors.accent} size={20} />}
            </Pressable>
          ))}
          {saving && <View style={styles.message}><ActivityIndicator color={colors.accent} /><Text style={styles.hint}>Сохраняем статус…</Text></View>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error} Выберите статус ещё раз.</Text>}
          <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>ОТМЕНА</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.66)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: colors.panel, paddingVertical: 12 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700', paddingHorizontal: 22, paddingVertical: 12 },
  option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, gap: 18 },
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
