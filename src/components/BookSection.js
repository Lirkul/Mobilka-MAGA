import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Text from './AppText';
import BookCard from './BookCard';
import Icon from './Icon';
import { colors, layout } from '../theme';

const keyExtractor = (book) => book.id;

export default function BookSection({ title, subtitle, books, width, hot = false }) {
  const cardWidth = (width - 56) / 3;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {hot && <Icon name="flame" size={23} />}
        <Pressable accessibilityRole="button" accessibilityLabel={`Все книги: ${title}`} onPress={() => router.push({ pathname: '/results', params: { mode: 'discover', filters: JSON.stringify({ sort: hot ? 'newest' : 'popularity' }) } })}><Text style={styles.all}>ВСЕ</Text></Pressable>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <FlatList
        horizontal
        data={books}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <BookCard book={item} width={cardWidth} />}
        contentContainerStyle={styles.books}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: layout.gutter },
  title: { flex: 1, color: colors.text, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  all: { fontSize: 14, fontWeight: '500', letterSpacing: 1, color: colors.accent },
  subtitle: { paddingHorizontal: layout.gutter, color: colors.secondary, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  books: { paddingLeft: layout.gutter, paddingRight: 8, gap: layout.gap },
});
