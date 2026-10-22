import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { colors } from '../theme';
import Icon from './Icon';
import RecentBooks from './RecentBooks';
import useAsyncResource from '../hooks/useAsyncResource';
import { getRecentBooks } from '../services/mockApi';

export default function AsyncState({ loading, error, onRetry }) {
  if (loading) return <View style={styles.container}><ActivityIndicator color={colors.accent} /><Text style={styles.message}>Загрузка…</Text></View>;
  if (!error) return null;
  if (error.code === 'offline') return <OfflineError onRetry={onRetry} />;
  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <Text style={styles.message}>{error.message || 'Не удалось загрузить данные'}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Повторить</Text></Pressable>
    </View>
  );
}

function OfflineError({ onRetry }) {
  const { data } = useAsyncResource(getRecentBooks);
  return <ScrollView testID="offline-state" style={styles.offlineScroll} contentContainerStyle={styles.offline}>
    <View style={styles.center}>
      <Icon name="wifiOff" size={48} color="#777" />
      <Text style={styles.offlineTitle}>Нет подключения к интернету</Text>
      <Text style={styles.message}>Обновите страницу или посмотрите книги из вашей библиотеки</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.refresh}><Text style={styles.refreshText}>ОБНОВИТЬ</Text></Pressable>
    </View>
    <RecentBooks books={data || []} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', gap: 12 },
  message: { color: colors.secondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.accent },
  retryText: { color: colors.accent, fontSize: 14 },
  offlineScroll: { flex: 1 },
  offline: { flexGrow: 1, minHeight: 400 },
  center: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  offlineTitle: { color: colors.text, fontSize: 15, textAlign: 'center', marginTop: 8 },
  refresh: { minHeight: 44, minWidth: 128, borderRadius: 6, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  refreshText: { color: colors.text, fontSize: 13, fontWeight: '500' },
});
