import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Text from '../../components/AppText';
import AsyncState from '../../components/AsyncState';
import BookResultItem from '../../components/BookResultItem';
import ScreenFrame from '../../components/ScreenFrame';
import useAsyncResource from '../../hooks/useAsyncResource';
import { getSeriesById } from '../../services/mockApi';
import { colors } from '../../theme';

export default function SeriesScreen() {
  const { id } = useLocalSearchParams();
  const seriesId = Array.isArray(id) ? id[0] : id;
  const loader = useCallback(() => getSeriesById(seriesId), [seriesId]);
  const { data: series, loading, error, reload } = useAsyncResource(loader);

  return (
    <ScreenFrame title="Цикл книг">
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && series && (
        <FlatList
          data={[...series.books].sort((a, b) => a.seriesOrder - b.seriesOrder)}
          keyExtractor={(book) => book.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={(
            <View style={styles.header}>
              <Text style={styles.title}>{series.title}</Text>
              <Text style={styles.status}>{series.status === 'completed' ? 'Цикл завершён' : 'Цикл в процессе'}</Text>
              <Text style={styles.description}>{series.description}</Text>
              <Text style={styles.heading}>Произведения цикла</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.order}>Книга {item.seriesOrder}</Text>
              <BookResultItem book={item} />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Произведений пока нет</Text>}
        />
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 16, paddingBottom: 32 },
  header: { paddingTop: 8, paddingHorizontal: 16, marginBottom: 8 },
  title: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: '700' },
  status: { color: colors.accent, fontSize: 14, marginTop: 10 },
  description: { color: colors.secondary, fontSize: 16, lineHeight: 24, marginTop: 18 },
  heading: { color: colors.text, fontSize: 21, fontWeight: '500', marginTop: 28, marginBottom: 12 },
  order: { color: colors.secondary, fontSize: 13, marginBottom: 8, marginTop: 8, paddingHorizontal: 16 },
  empty: { color: colors.secondary, fontSize: 15, padding: 20 },
});
