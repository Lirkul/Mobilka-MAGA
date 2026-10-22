import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { getBookCover } from '../data/imageSources';
import { colors } from '../theme';

export default function RecentBooks({ books }) {
  return <View style={styles.section}>
    <Text style={styles.title}>Последние книги</Text><Text style={styles.subtitle}>Книги, которые вы недавно читали</Text>
    <FlatList horizontal data={books} keyExtractor={(book) => book.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.subtitle}>Начните читать книгу — она появится здесь.</Text>} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Продолжить чтение «${item.title}»`} onPress={() => router.push({ pathname: '/reader/[id]', params: { id: item.id } })} style={styles.book}><Image source={getBookCover(item.coverKey)} style={styles.cover} /><Text style={styles.name} numberOfLines={2}>{item.title}</Text></Pressable>} />
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/library')} style={styles.button}><Text style={styles.buttonText}>В БИБЛИОТЕКУ</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  section: { backgroundColor: colors.card, paddingVertical: 12 },
  title: { color: colors.text, fontWeight: '700', fontSize: 14, paddingHorizontal: 16 },
  subtitle: { color: colors.secondary, fontSize: 12, paddingHorizontal: 16, marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 10, paddingTop: 10 },
  book: { width: 78 }, cover: { width: 78, height: 112, borderRadius: 3 },
  name: { color: colors.text, fontSize: 11, lineHeight: 14, marginTop: 5 },
  button: { minHeight: 40, marginHorizontal: 16, marginTop: 12, borderRadius: 5, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.text, fontSize: 12, fontWeight: '500' },
});
