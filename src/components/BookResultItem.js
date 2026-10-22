import { memo } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { toBookCard } from '../services/catalog';
import { colors } from '../theme';

function BookResultItem({ book }) {
  const item = toBookCard(book);
  return (
    <Pressable testID={`book-result-${book.id}`} accessibilityRole="button" accessibilityLabel={`Открыть книгу «${book.title}»`} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.coverColumn}>
        <Image source={item.cover} accessibilityLabel={`Обложка книги «${book.title}»`} style={styles.cover} />
        <Text style={[styles.price, book.access === 'free' && styles.free]}>{item.priceLabel}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.secondary}>{book.genres.join(', ')}</Text>
        <Text style={styles.secondary}>{book.status === 'ongoing' ? 'В процессе' : 'Завершено'} · {book.ageRating}</Text>
        <Text style={styles.stats}>{book.stats.views.toLocaleString('ru-RU')} просмотров · {book.stats.likes} ♡</Text>
        {book.libraryStatus && <Text style={styles.stats}>{({ reading: 'Читаю', planned: 'Прочту позже', finished: 'Прочитано', not_interested: 'Не интересно' })[book.libraryStatus]}</Text>}
        {book.readingProgress && <Text style={styles.stats}>Прочитано: {book.readingProgress.percent}% главы</Text>}
        <Text style={styles.description} numberOfLines={4}>{book.description}</Text>
      </View>
    </Pressable>
  );
}

export default memo(BookResultItem);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, marginHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.divider },
  coverColumn: { width: 90 },
  cover: { width: 90, height: 135, borderRadius: 5 },
  info: { flex: 1, gap: 8 },
  title: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  author: { color: colors.secondary, fontSize: 14 },
  secondary: { color: colors.secondary, fontSize: 12, lineHeight: 17 },
  stats: { color: colors.accent, fontSize: 12, lineHeight: 17 },
  description: { color: colors.text, fontSize: 13, lineHeight: 18 },
  price: { color: colors.accent, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 6 },
  free: { color: '#8db969' },
  pressed: { opacity: 0.6 },
});
