import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

export default function ChapterPickerModal({ visible, chapters, selectedId, onSelect, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть оглавление" />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.heading}>Оглавление</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть" style={styles.close}><Icon name="close" /></Pressable>
          </View>
          <FlatList
            data={chapters}
            keyExtractor={(chapter) => chapter.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: item.id === selectedId }}
                style={({ pressed }) => [styles.chapter, (item.id === selectedId || pressed) && styles.selected]}
              >
                <View style={styles.chapterInfo}>
                  <Text style={[styles.title, item.id === selectedId && styles.current]}>{item.title}</Text>
                  <Text style={styles.date}>{new Date(item.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</Text>
                </View>
                <Text style={styles.access}>{item.isFree ? 'Бесплатно' : 'Платная глава'}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Главы пока не опубликованы.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.66)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 448, maxHeight: '82%', backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.header, paddingLeft: 18 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1 },
  close: { minWidth: 52, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  chapter: { minHeight: 72, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, flexDirection: 'row', gap: 12, alignItems: 'center' },
  selected: { backgroundColor: colors.segment },
  chapterInfo: { flex: 1, gap: 7 },
  title: { color: colors.text, fontSize: 15 },
  current: { color: colors.accent },
  date: { color: colors.secondary, fontSize: 12 },
  access: { color: colors.secondary, fontSize: 11 },
  empty: { padding: 24, color: colors.secondary, fontSize: 15 },
});
