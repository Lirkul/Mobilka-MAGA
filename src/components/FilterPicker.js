import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';
import { genreTree } from '../data/genreTree';
import MotionSurface from './MotionSurface';

// Kept inside the existing Modal: no nested native modal or extra route.
export default function FilterPicker({ field, value, onApply, onClose }) {
  const [draft, setDraft] = useState(value);
  const genres = field.key === 'genres' || field.key === 'excludedGenres';
  const options = genres ? genreTree.flatMap(group => [
    { value: group.label, label: group.label, children: group.children || [] },
    ...(group.children || []).map(label => ({ value: label, label, parent: group.label })),
  ]) : field.options;

  function select(option) {
    if (Array.isArray(draft)) {
      const children = genres ? genreTree.find(group => group.label === option)?.children || [] : [];
      setDraft(draft.includes(option) ? draft.filter((item) => item !== option) : [...draft.filter(item => !children.includes(item)), option]);
    } else {
      onApply(option);
    }
  }

  return (
    <View style={[styles.overlay, genres && styles.genreOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть выбор фильтра" />
      <MotionSurface motion="dialog" style={[styles.dialog, genres && styles.genreDialog]}>
        <Text accessibilityRole="header" style={styles.title}>{field.title || field.label}</Text>
        <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
          {genres && <Pressable accessibilityRole="checkbox" accessibilityLabel="Любой жанр" accessibilityState={{ checked: draft.length === 0 }} aria-checked={draft.length === 0} onPress={() => setDraft([])} style={[styles.option, styles.genreRootOption]}><View style={[styles.indicator, draft.length === 0 && styles.selected]}>{draft.length === 0 && <Icon name="check" size={14} color={colors.panel} />}</View><Text style={styles.groupLabel}>Любой</Text></Pressable>}
          {options.map((option) => {
            const inherited = genres && option.parent && draft.includes(option.parent);
            const selected = Array.isArray(draft) ? draft.includes(option.value) || inherited : draft === option.value;
            return (
              <Pressable key={option.value} accessibilityRole={field.multiple ? 'checkbox' : 'radio'} disabled={!!inherited} aria-checked={!!selected} accessibilityState={{ checked: !!selected, disabled: !!inherited }} accessibilityLabel={option.label} onPress={() => select(option.value)} style={[styles.option, genres && styles.genreRootOption, genres && option.parent && styles.genreOption]}>
                <View style={[styles.indicator, !field.multiple && styles.radio, selected && field.multiple && styles.selected]}>
                  {selected && (field.multiple ? <Icon name="check" size={14} color={genres ? colors.panel : colors.text} /> : <View style={styles.dot} />)}
                </View>
                <Text style={[styles.label, genres && !option.parent && styles.parentLabel, inherited && styles.inherited]}>{option.label}</Text>
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
      </MotionSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 10 },
  genreOverlay: { paddingHorizontal: 0 },
  dialog: { width: '100%', maxWidth: 416, maxHeight: '80%', backgroundColor: colors.panel, borderRadius: 26, paddingTop: 22, paddingBottom: 10 },
  genreDialog: { maxWidth: 480, maxHeight: '60%' },
  title: { color: colors.text, fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginBottom: 8 },
  options: { flexGrow: 0 },
  groupLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  genreRootOption: { paddingHorizontal: 28 }, genreOption: { paddingLeft: 48 },
  parentLabel: { fontWeight: '700' }, inherited: { color: '#898989' },
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
