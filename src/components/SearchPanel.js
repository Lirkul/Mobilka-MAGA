import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Text from './AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { additionalFields, createDefaultFilters, filterFields, getFilterLabel } from '../data/filters';
import { colors, fonts, layout } from '../theme';
import FilterPicker from './FilterPicker';
import FilterRow from './FilterRow';
import Icon from './Icon';
import MotionSurface from './MotionSurface';
import Expandable from './Expandable';

export default function SearchPanel({ visible, onClose, onSearch, onDiscover, initialFilters = null, initialQuery = '', initialPickerKey = null, embedded = false }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(() => initialFilters || createDefaultFilters());
  const [expanded, setExpanded] = useState(false);
  const [picker, setPicker] = useState(() => [...filterFields, ...additionalFields].find((field) => field.key === initialPickerKey) || null);
  const [result, setResult] = useState(null);
  const input = useRef(null);
  const scroll = useRef(null);

  function closePanel() {
    Keyboard.dismiss();
    setPicker(null);
    setResult(null);
    onClose();
  }

  function close() {
    if (picker) setPicker(null);
    else closePanel();
  }

  function submitSearch() {
    if (!query.trim()) {
      setResult({ message: 'Введите название, имя автора или текст поста.' });
      input.current?.focus();
      return;
    }
    Keyboard.dismiss();
    closePanel();
    onSearch(query.trim());
  }

  function submitFilters() {
    Keyboard.dismiss();
    closePanel();
    onDiscover(filters);
  }

  function reset() {
    setQuery('');
    setFilters(createDefaultFilters());
    setResult(null);
    setExpanded(false);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  const content = (
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable accessibilityRole="button" accessibilityLabel="Закрыть поиск" onPress={closePanel} style={StyleSheet.absoluteFill} />
        <MotionSurface testID="search-panel" visible={visible || embedded} style={[styles.panel, { paddingBottom: insets.bottom, marginTop: Math.max(insets.top, 16) }]}>
          <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content} onContentSizeChange={() => { if (result) scroll.current?.scrollToEnd({ animated: true }); }}>
            <Text accessibilityRole="header" style={styles.heading}>Найдите авторов, книги или посты</Text>
            <View style={styles.searchRow}>
              <TextInput
                ref={input}
                value={query}
                onChangeText={(text) => { setQuery(text); setResult(null); }}
                placeholder="Поиск"
                placeholderTextColor={colors.secondary}
                accessibilityLabel="Поиск книг, авторов и постов"
                returnKeyType="search"
                autoCorrect={false}
                onSubmitEditing={submitSearch}
                selectionColor={colors.accent}
                underlineColorAndroid="transparent"
                style={styles.input}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Искать книги, авторов и посты" onPress={submitSearch} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
                <Icon name="search" color="#fff" />
              </Pressable>
            </View>
            <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>или</Text><View style={styles.line} /></View>
            <Text accessibilityRole="header" style={[styles.heading, styles.discoveryHeading]}>Подберите книги по интересам</Text>
            {filterFields.map((field) => <FilterRow key={field.key} label={field.label} value={getFilterLabel(field, filters[field.key])} onPress={() => { Keyboard.dismiss(); setPicker(field); }} />)}
            <Pressable accessibilityRole="button" accessibilityLabel="Дополнительные фильтры" aria-expanded={expanded} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.additional}>
              <Text style={styles.additionalText}>Дополнительно</Text><Icon name={expanded ? 'down' : 'left'} size={20} color={colors.secondary} />
            </Pressable>
            <Expandable testID="additional-filter-fields" expanded={expanded} style={styles.additionalFields}>
              {additionalFields.map((field) => <FilterRow key={field.key} label={field.label} value={getFilterLabel(field, filters[field.key])} onPress={() => setPicker(field)} />)}
            </Expandable>
            <Pressable accessibilityRole="button" onPress={submitFilters} style={({ pressed }) => [styles.discoverButton, pressed && styles.pressed]}>
              <Text style={styles.discoverText}>ПОДОБРАТЬ</Text>
            </Pressable>
            {result && <View accessibilityLiveRegion="polite" style={styles.result}>
              <Text style={styles.resultText}>{result.message}</Text>
            </View>}
            <Pressable accessibilityRole="button" onPress={reset} style={styles.reset}><Text style={styles.resetText}>СБРОСИТЬ ВСЁ</Text></Pressable>
          </ScrollView>
        </MotionSurface>
        {picker && <FilterPicker key={picker.key} field={picker} value={filters[picker.key]} onClose={() => setPicker(null)} onApply={(value) => {
          setFilters((previous) => ({ ...previous, [picker.key]: value }));
          setResult(null);
          setPicker(null);
        }} />}
      </KeyboardAvoidingView>
  );
  return embedded ? content : <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>{content}</Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.64)' },
  panel: { backgroundColor: colors.panel, width: '100%', maxWidth: layout.maxWidth, maxHeight: '92%', flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heading: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  input: { flex: 1, minWidth: 0, height: 44, borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingHorizontal: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  searchButton: { width: 44, height: 44, backgroundColor: colors.accent, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: -16, marginTop: 11, marginBottom: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.divider },
  or: { color: colors.divider, fontWeight: '700', fontSize: 16 },
  discoveryHeading: { marginBottom: 18 },
  additional: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  additionalText: { color: colors.text, fontSize: 14 },
  additionalFields: { marginBottom: 8 },
  discoverButton: { minHeight: 44, backgroundColor: colors.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  discoverText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  reset: { minHeight: 55, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  resetText: { color: colors.accent, fontWeight: '500', fontSize: 14, letterSpacing: 1 },
  pressed: { opacity: 0.65 },
  result: { borderTopWidth: 1, borderColor: colors.divider, marginTop: 16, paddingTop: 12 },
  resultText: { fontSize: 13, lineHeight: 20, color: colors.text },
});
