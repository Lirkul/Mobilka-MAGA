import { memo } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { toBookCard } from '../services/catalog';
import { colors, layout } from '../theme';

function LibraryBookCard({ book, onStatus, onAvailability }) {
  const { width } = useWindowDimensions();
  const coverWidth = Math.round(Math.min(width, layout.maxWidth) * 0.205);
  const item = toBookCard(book);
  const percent = book.readingProgress?.bookPercent || 0;
  const openBook = () => router.push({ pathname: '/book/[id]', params: { id: book.id } });
  const sizeLabel = `${(book.textLength / 1000).toFixed(1).replace('.', ',')}К зн.`;
  return <View testID={`library-card-${book.id}`} style={styles.card}>
    <View style={styles.top}>
      <Pressable testID={`book-result-${book.id}`} accessibilityRole="button" accessibilityLabel={`Открыть книгу «${book.title}»`} onPress={openBook} style={styles.main}>
        <View style={{ width: coverWidth }}>
          <Image source={item.cover} accessibilityLabel={`Обложка книги «${book.title}»`} style={[styles.cover, { width: coverWidth, height: coverWidth * 1.5 }]} />
          <Text accessibilityLabel={`Прочитано книги: ${percent}%`} style={styles.percent}>{percent}%</Text>
          <View accessibilityRole="progressbar" accessibilityLabel="Прогресс книги" accessibilityValue={{ min: 0, max: 100, now: percent }} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} style={styles.track}><View style={[styles.progress, { width: `${percent}%` }]} /></View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={3}>{book.title}</Text>
          <Text style={styles.author} numberOfLines={2}>{item.author}</Text>
          {!!book.seriesTitle && <Text style={styles.series} numberOfLines={2}>{book.seriesTitle} #{book.seriesOrder}</Text>}
          <View style={styles.size}><Icon name={book.status === 'completed' ? 'check' : 'pencil'} color={book.status === 'completed' ? '#84b65c' : colors.accent} size={18} /><Text style={styles.sizeText}>{sizeLabel}</Text></View>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`О книге «${book.title}»`} onPress={openBook} style={styles.iconButton}><Icon name="openBook" color={colors.accent} size={22} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Изменить статус книги «${book.title}»`} onPress={() => onStatus(book)} style={styles.iconButton}><Icon name="sparkles" color={colors.accent} size={22} /></Pressable>
      </View>
    </View>
    <View style={styles.footer}>
      <Text style={[styles.price, book.access === 'free' && styles.free]}>{item.priceLabel}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Доступ без сети: «${book.title}»`} onPress={() => onAvailability(book)} style={styles.cloud}><Icon name="cloudCheck" color={colors.accent} size={24} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Читать «${book.title}»`} onPress={() => router.push({ pathname: '/reader/[id]', params: { id: book.id } })} style={styles.read}><Text style={styles.readText}>Читать</Text></Pressable>
    </View>
  </View>;
}
export default memo(LibraryBookCard);
const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 7, marginHorizontal: 8, marginBottom: 8, overflow: 'hidden' },
  top: { padding: 16, paddingRight: 8, flexDirection: 'row', gap: 4 },
  main: { flex: 1, flexDirection: 'row', gap: 16 },
  cover: { borderRadius: 5 }, percent: { color: colors.secondary, fontSize: 12, textAlign: 'center', marginTop: 5, marginBottom: 2 },
  track: { height: 3, backgroundColor: '#343434', borderRadius: 2, overflow: 'hidden' }, progress: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  info: { flex: 1, minHeight: 144 }, title: { color: colors.text, fontSize: 17, lineHeight: 21 },
  author: { color: colors.secondary, fontSize: 13, lineHeight: 18, marginTop: 4 }, series: { color: colors.secondary, fontSize: 13, lineHeight: 18, marginTop: 3 },
  size: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3, marginTop: 'auto', paddingTop: 12 }, sizeText: { color: colors.secondary, fontSize: 12 },
  actions: { width: 28, gap: 0 }, iconButton: { width: 28, height: 44, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 1 },
  footer: { minHeight: 60, paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderColor: '#5b5c5e', flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { color: colors.accent, fontSize: 15, flex: 1 }, free: { color: '#84b65c' },
  cloud: { minHeight: 44, width: 36, alignItems: 'center', justifyContent: 'center' },
  read: { minWidth: 88, minHeight: 38, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#444444' },
  readText: { color: colors.accent, fontSize: 16, fontWeight: '500', letterSpacing: 1 },
});
