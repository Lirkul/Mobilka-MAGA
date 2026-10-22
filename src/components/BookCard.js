import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { colors } from '../theme';

function BookCard({ book, width }) {
  return (
    <View style={[styles.card, { width }]}>
      <View style={{ height: width * (366 / 256) }}>
        <Image source={book.cover} accessibilityLabel={`Обложка книги «${book.title}», эксклюзив`} style={[styles.cover, { width: width * (265 / 256), height: width * (374 / 256), marginLeft: -width * (9 / 256) }]} resizeMode="contain" />
      </View>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={3}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={2}>{book.author}</Text>
      </View>
      <View style={styles.price}><Text style={styles.priceText} numberOfLines={1}>{book.priceLabel}</Text></View>
    </View>
  );
}

export default memo(BookCard);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6 },
  cover: { borderTopRightRadius: 6 },
  details: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 10, minHeight: 98 },
  title: { color: colors.text, fontSize: 13, lineHeight: 14.5 },
  author: { color: colors.secondary, fontSize: 10.5, lineHeight: 12.5, marginTop: 8 },
  price: { borderTopWidth: 1, borderColor: colors.divider, height: 31, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  priceText: { color: colors.accent, fontSize: 10.5 },
});
