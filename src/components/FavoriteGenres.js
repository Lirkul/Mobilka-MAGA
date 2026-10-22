import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import Icon from './Icon';
import FilterPicker from './FilterPicker';
import { preferenceGenres } from '../data/preferenceGenres';
import { colors } from '../theme';

const genreField = { title: 'Любимые жанры', multiple: true, options: preferenceGenres };

export default function FavoriteGenres({ value, busy, error, onChange, onRetry }) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [editing, setEditing] = useState(false);
  const visibleGenres = showAll ? preferenceGenres : preferenceGenres.filter((genre, index) => index < 6 || value.includes(genre.value));

  return (
    <View testID="favorite-genres" style={styles.card}>
      <View style={styles.heading}>
        <Pressable accessibilityRole="button" accessibilityLabel="Любимые жанры" aria-expanded={expanded} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.titleButton}>
          <Text style={styles.title}>Любимые жанры</Text>
          <Icon name={expanded ? 'up' : 'down'} size={16} color={colors.accent} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Настроить любимые жанры" disabled={busy} onPress={() => setEditing(true)} style={styles.settings}>
          <Icon name="settings" size={23} color={colors.accent} />
        </Pressable>
      </View>
      {expanded && <>
        <Text style={styles.description}>Выберите жанры, которые хотите видеть на главной и в рекомендациях</Text>
        <View style={styles.genres}>
          {visibleGenres.map((genre) => {
            const checked = value.includes(genre.value);
            return (
              <Pressable key={genre.value} accessibilityRole="checkbox" accessibilityLabel={genre.label} aria-checked={checked} accessibilityState={{ checked, disabled: busy }} disabled={busy} onPress={() => onChange(checked ? value.filter((item) => item !== genre.value) : [...value, genre.value])} style={({ pressed }) => [styles.genre, checked && styles.selected, pressed && styles.pressed]}>
                <Icon name={genre.icon} size={22} color={checked ? colors.text : colors.secondary} />
                <Text style={styles.genreLabel}>{genre.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" aria-expanded={showAll} accessibilityState={{ expanded: showAll }} onPress={() => setShowAll(!showAll)} style={styles.action}>
            <Text style={styles.actionText}>{showAll ? 'Меньше жанров' : 'Больше жанров'}</Text><Icon name={showAll ? 'up' : 'down'} size={14} color={colors.accent} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Сбросить любимые жанры" disabled={busy} onPress={() => onChange([])} style={styles.action}>
            <Text style={styles.actionText}>Сбросить</Text><Icon name="reset" size={18} color={colors.accent} />
          </Pressable>
        </View>
      </>}
      {error && <View accessibilityLiveRegion="polite"><Text style={styles.error}>Не удалось сохранить или загрузить любимые жанры.</Text><Pressable accessibilityRole="button" onPress={onRetry} disabled={busy} style={styles.action}><Text style={styles.actionText}>Повторить</Text></Pressable></View>}
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.modal}>
          {editing && <FilterPicker field={genreField} value={value} onClose={() => setEditing(false)} onApply={async (next) => { await onChange(next); setEditing(false); }} />}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, backgroundColor: colors.card, borderRadius: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: colors.text, fontSize: 20, flexShrink: 1 },
  settings: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  description: { color: colors.secondary, fontSize: 13, lineHeight: 16, marginTop: 2, marginBottom: 18 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  genre: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 42, maxWidth: '100%', paddingHorizontal: 7, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#494949', backgroundColor: '#2e2e2e' },
  selected: { borderColor: colors.accent, backgroundColor: '#294b61' },
  pressed: { opacity: 0.75 },
  genreLabel: { color: colors.text, fontSize: 15, lineHeight: 20, flexShrink: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  action: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: colors.accent, fontSize: 13 },
  error: { color: '#f3a99d', fontSize: 13, lineHeight: 18, marginTop: 8 },
  modal: { flex: 1 },
});
