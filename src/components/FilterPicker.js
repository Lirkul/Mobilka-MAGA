import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

// Kept inside the existing Modal: no nested native modal or extra route.
export default function FilterPicker({ field, value, onApply, onClose }) {
  const [draft, setDraft] = useState(value);

  function select(option) {
    if (Array.isArray(draft)) {
      setDraft(draft.includes(option) ? draft.filter((item) => item !== option) : [...draft, option]);
    } else {
      onApply(option);
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть выбор фильтра" />
      <View accessibilityViewIsModal style={styles.dialog}>
        <Text accessibilityRole="header" style={styles.title}>{field.title || field.label}</Text>
        <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
          {field.options.map((option) => {
            const selected = Array.isArray(draft) ? draft.includes(option.value) : draft === option.value;
            return (
              <Pressable key={option.value} accessibilityRole={field.multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected }} accessibilityLabel={option.label} onPress={() => select(option.value)} style={styles.option}>
                <View style={[styles.indicator, !field.multiple && styles.radio, selected && styles.selected]}>
                  {selected && <Icon name="check" size={14} color={colors.text} />}
                </View>
                <Text style={styles.label}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.actions}>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.action}><Text style={styles.actionText}>ОТМЕНА</Text></Pressable>
          {field.multiple && <>
            <Pressable onPress={() => setDraft([])} accessibilityRole="button" style={styles.action}><Text style={styles.actionText}>СБРОСИТЬ</Text></Pressable>
            <Pressable onPress={() => onApply(draft)} accessibilityRole="button" style={styles.action}><Text style={styles.actionText}>ВЫБРАТЬ</Text></Pressable>
          </>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 400, maxHeight: '80%', backgroundColor: colors.panel, borderRadius: 16, paddingTop: 20, paddingBottom: 8 },
  title: { color: colors.text, fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginBottom: 8 },
  options: { flexGrow: 0 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  indicator: { width: 18, height: 18, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  radio: { borderRadius: 9 },
  selected: { backgroundColor: colors.accent },
  label: { color: colors.text, fontSize: 14, flexShrink: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', paddingHorizontal: 8 },
  action: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  actionText: { color: colors.accent, fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
});
