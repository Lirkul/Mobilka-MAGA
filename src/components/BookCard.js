import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Text from './AppText';
import { colors } from '../theme';

function BookCard({ book, width, authorGrid = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть книгу «${book.title}»`} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })} style={[styles.card, { width }, authorGrid && styles.plain]}>
      {authorGrid && <Text style={styles.topPrice}>{book.priceLabel}</Text>}
      <View style={{ height: width * (366 / 256) }}>
        <Image source={book.cover} accessibilityLabel={`Обложка книги «${book.title}»`} style={[styles.cover, { width, height: width * (366 / 256) }]} resizeMode="cover" />
      </View>
      <View style={[styles.details, authorGrid && styles.center]}>
        <Text style={styles.title} numberOfLines={3}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={2}>{book.author}</Text>
      </View>
      {!authorGrid && <View style={styles.price}><Text style={styles.priceText} numberOfLines={1}>{book.priceLabel}</Text></View>}
    </Pressable>
  );
}

export default memo(BookCard);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6 },
  plain: { backgroundColor: 'transparent' },
  center: { alignItems: 'center', paddingHorizontal: 1 },
  topPrice: { color: colors.secondary, fontSize: 11, textAlign: 'center', minHeight: 30, paddingBottom: 10 },
  cover: { borderTopRightRadius: 6, borderTopLeftRadius: 6 },
  details: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 10, minHeight: 98 },
  title: { color: colors.text, fontSize: 13, lineHeight: 14.5 },
  author: { color: colors.secondary, fontSize: 10.5, lineHeight: 12.5, marginTop: 8 },
  price: { borderTopWidth: 1, borderColor: colors.divider, height: 31, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  priceText: { color: colors.accent, fontSize: 10.5 },
});
