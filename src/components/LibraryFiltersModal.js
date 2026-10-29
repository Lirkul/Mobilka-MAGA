import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import FilterRow from './FilterRow';
import FilterPicker from './FilterPicker';
import { additionalFields, filterFields, getFilterLabel } from '../data/filters';
import { createLibraryFilters } from '../data/libraryShelves';
import { colors } from '../theme';

const fields = [...filterFields, ...additionalFields].filter((field) => ['genres', 'excludedGenres', 'format', 'status', 'access'].includes(field.key));

export default function LibraryFiltersModal({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const [picker, setPicker] = useState(null);
  return <Modal transparent visible animationType="none" onRequestClose={() => picker ? setPicker(null) : onClose()}>
    <SafeAreaView style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть фильтры библиотеки" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.dialog}>
        <Text accessibilityRole="header" style={styles.title}>Фильтры библиотеки</Text>
        <ScrollView contentContainerStyle={styles.content}>
          {fields.map((field) => <FilterRow key={field.key} label={field.label} value={getFilterLabel(field, draft[field.key])} onPress={() => setPicker(field)} />)}
        </ScrollView>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.action}><Text style={styles.link}>ОТМЕНА</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setDraft(createLibraryFilters())} style={styles.action}><Text style={styles.link}>СБРОСИТЬ</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => onApply(draft)} style={styles.action}><Text style={styles.link}>ПРИМЕНИТЬ</Text></Pressable>
        </View>
      </View>
      {picker && <FilterPicker key={picker.key} field={picker} value={draft[picker.key]} onClose={() => setPicker(null)} onApply={(value) => { setDraft((previous) => ({ ...previous, [picker.key]: value })); setPicker(null); }} />}
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 400, maxHeight: '85%', backgroundColor: colors.panel, borderRadius: 12, paddingTop: 20 },
  title: { color: colors.text, fontSize: 18, fontWeight: '500', paddingHorizontal: 20, marginBottom: 12 },
  content: { paddingHorizontal: 20 }, actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', padding: 8 },
  action: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, link: { color: colors.accent, fontSize: 12, fontWeight: '500' },
});
