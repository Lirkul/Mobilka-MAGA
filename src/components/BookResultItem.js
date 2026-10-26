import { memo } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { toBookCard } from '../services/catalog';
import { libraryStatusLabels } from './LibraryStatusModal';
import { colors } from '../theme';

const count = (value) => value >= 10000 ? `${Math.round(value / 1000)}К` : value.toLocaleString('ru-RU');

function BookResultItem({ book, onStatus = null }) {
  const item = toBookCard(book);
  const openBook = () => router.push({ pathname: '/book/[id]', params: { id: book.id } });
  return <View testID={`book-result-${book.id}`} style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть книгу «${book.title}»`} onPress={openBook} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
      <View style={styles.coverColumn}>
        <Image source={item.cover} accessibilityLabel={`Обложка книги «${book.title}»`} style={styles.cover} />
        <Text style={[styles.price, book.access === 'free' && styles.free]}>{item.priceLabel}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.details}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.genres}>{book.genres.join(', ')}</Text>
        </View>
        {book.ageRating === '18+' && <Text style={styles.age}>18+</Text>}
        <View style={styles.stats}>
          <View style={styles.stat}><Icon name={book.status === 'completed' ? 'check' : 'pencil'} color={book.status === 'completed' ? '#8db969' : colors.accent} size={15} /><Text style={styles.number}>{count(book.textLength || 0)}</Text></View>
          <View style={styles.stat}><Icon name="eye" color={colors.accent} size={15} /><Text style={styles.number}>{count(book.stats.views)}</Text></View>
          <View style={styles.stat}><Icon name="heart" color={colors.accent} size={14} /><Text style={styles.number}>{count(book.stats.likes)}</Text></View>
        </View>
        {!!book.libraryStatus && <Text style={styles.library}>{libraryStatusLabels[book.libraryStatus]}</Text>}
        {!!book.readingProgress && <Text style={styles.library}>Прочитано: {book.readingProgress.percent}% главы</Text>}
        <Text style={styles.description} numberOfLines={4}>{book.description}</Text>
      </View>
    </Pressable>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Изменить статус книги «${book.title}»`} onPress={onStatus || openBook} style={styles.action}><Icon name={book.libraryStatus ? 'check' : 'plus'} color={colors.accent} size={23} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Открыть произведение «${book.title}»`} onPress={openBook} style={styles.action}><Icon name="sparkles" color={colors.accent} size={23} /></Pressable>
    </View>
  </View>;
}
export default memo(BookResultItem);

const styles = StyleSheet.create({
  row: { marginHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.divider },
  main: { flexDirection: 'row', gap: 16, minHeight: 145 },
  coverColumn: { width: 90 }, cover: { width: 90, height: 135, borderRadius: 5 },
  info: { flex: 1, minWidth: 0 }, details: { paddingRight: 40, minHeight: 82 },
  title: { color: colors.text, fontSize: 15, lineHeight: 18, fontWeight: '700' },
  author: { color: colors.secondary, fontSize: 14, lineHeight: 19, marginTop: 5 },
  genres: { color: colors.secondary, fontSize: 12, lineHeight: 16, marginTop: 10 },
  age: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ce5659', color: '#ce5659', borderRadius: 14, paddingHorizontal: 5, paddingVertical: 2, fontSize: 12, marginTop: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 8 }, stat: { flexDirection: 'row', alignItems: 'center', gap: 4 }, number: { color: colors.secondary, fontSize: 12 },
  library: { color: colors.accent, fontSize: 11, lineHeight: 16, marginTop: 4 },
  description: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 16 },
  price: { color: colors.accent, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 }, free: { color: '#8db969' },
  actions: { position: 'absolute', top: 16, right: 0, gap: 8 }, action: { width: 36, height: 36, borderWidth: 1, borderColor: colors.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
