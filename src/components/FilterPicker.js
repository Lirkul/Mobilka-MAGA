import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

// Kept inside the existing Modal: no nested native modal or extra route.
export default function FilterPicker({ field, value, onApply, onClose }) {
  const [draft, setDraft] = useState(value);
  const genres = field.key === 'genres' || field.key === 'excludedGenres';
  const groups = genres ? [
    { title: 'Фэнтези', values: ['Фэнтези', 'Бытовое фэнтези', 'Героическое фэнтези', 'Романтическое фэнтези', 'Темное фэнтези'] },
    { title: 'Фантастика', values: ['Боевая фантастика', 'Космическая фантастика', 'Научная фантастика', 'Киберпанк', 'Постапокалипсис'] },
    { title: 'Другие жанры', values: ['Альтернативная история', 'Детектив', 'Мистика', 'Приключения'] },
  ] : null;
  const options = groups ? groups.flatMap((group) => [
    { heading: group.title }, ...group.values.map((value) => field.options.find((option) => option.value === value)).filter(Boolean),
  ]) : field.options;

  function select(option) {
    if (Array.isArray(draft)) {
      setDraft(draft.includes(option) ? draft.filter((item) => item !== option) : [...draft, option]);
    } else {
      onApply(option);
    }
  }

  return (
    <View style={[styles.overlay, genres && styles.genreOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть выбор фильтра" />
      <View accessibilityViewIsModal style={[styles.dialog, genres && styles.genreDialog]}>
        <Text accessibilityRole="header" style={styles.title}>{field.title || field.label}</Text>
        <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
          {genres && <Pressable accessibilityRole="checkbox" accessibilityLabel="Любой жанр" accessibilityState={{ checked: draft.length === 0 }} aria-checked={draft.length === 0} onPress={() => setDraft([])} style={styles.option}><View style={[styles.indicator, draft.length === 0 && styles.selected]}>{draft.length === 0 && <Icon name="check" size={14} color={colors.text} />}</View><Text style={styles.groupLabel}>Любой</Text></Pressable>}
          {options.map((option) => {
            if (option.heading) return <Text key={`group-${option.heading}`} style={styles.group}>{option.heading}</Text>;
            const selected = Array.isArray(draft) ? draft.includes(option.value) : draft === option.value;
            return (
              <Pressable key={option.value} accessibilityRole={field.multiple ? 'checkbox' : 'radio'} aria-checked={selected} accessibilityState={{ checked: selected }} accessibilityLabel={option.label} onPress={() => select(option.value)} style={[styles.option, genres && styles.genreOption]}>
                <View style={[styles.indicator, !field.multiple && styles.radio, selected && field.multiple && styles.selected]}>
                  {selected && (field.multiple ? <Icon name="check" size={14} color={colors.text} /> : <View style={styles.dot} />)}
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
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 10 },
  genreOverlay: { paddingHorizontal: 0 },
  dialog: { width: '100%', maxWidth: 416, maxHeight: '80%', backgroundColor: colors.panel, borderRadius: 26, paddingTop: 22, paddingBottom: 10 },
  genreDialog: { maxWidth: 480, maxHeight: '78%' },
  title: { color: colors.text, fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginBottom: 8 },
  options: { flexGrow: 0 },
  group: { color: colors.text, fontSize: 14, fontWeight: '700', paddingHorizontal: 28, paddingTop: 14, paddingBottom: 2 },
  groupLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  genreOption: { paddingLeft: 44 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  indicator: { width: 18, height: 18, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  radio: { borderRadius: 9 },
  dot: { width: 9, height: 9, backgroundColor: colors.accent, borderRadius: 5 },
  selected: { backgroundColor: colors.accent },
  label: { color: colors.text, fontSize: 14, flexShrink: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', paddingHorizontal: 8 },
  action: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  actionText: { color: colors.accent, fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
});
