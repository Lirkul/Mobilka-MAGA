import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './AppText';
import Icon from './Icon';
import { colors, layout } from '../theme';

export default function LibraryPopup({ visible, title = null, options, value, counts = null, onSelect, onClose }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const screenWidth = Math.min(width, layout.maxWidth);
  const top = insets.top + 54;
  return <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть список библиотеки" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View accessibilityRole="radiogroup" accessibilityLabel={title || 'Полки библиотеки'} style={[styles.popup, { top, right: (width - screenWidth) / 2 + 16, width: Math.min(260, Math.max(240, screenWidth * 0.62), screenWidth - 32), maxHeight: height - top - insets.bottom - 16 }]}>
        {!!title && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((option) => {
            const checked = value === option.value;
            return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked }} aria-checked={checked} onPress={() => onSelect(option.value)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
              {!!option.icon && <Icon name={option.icon} size={24} color={checked ? colors.accent : colors.text} />}
              <Text style={[styles.label, checked && styles.selected]}>{option.label}</Text>
              {counts && <Text testID={`shelf-count-${option.value}`} style={[styles.count, checked && styles.selected]}>{counts[option.value] ?? '…'}</Text>}
            </Pressable>;
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1 }, popup: { position: 'absolute', backgroundColor: colors.panel, borderRadius: 7, paddingVertical: 8, elevation: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: '500', paddingHorizontal: 16, paddingVertical: 10 },
  option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 12 },
  label: { color: colors.text, fontSize: 16, lineHeight: 21, flex: 1 }, count: { color: colors.text, fontSize: 14, minWidth: 20, textAlign: 'right' },
  selected: { color: colors.accent }, pressed: { backgroundColor: '#464646' },
});
