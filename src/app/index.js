import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Text from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import BookSection from '../components/BookSection';
import ReadingReminder from '../components/ReadingReminder';
import SearchPanel from '../components/SearchPanel';
import FavoriteGenres from '../components/FavoriteGenres';
import AsyncState from '../components/AsyncState';
import useAsyncResource from '../hooks/useAsyncResource';
import { getHomeContent } from '../services/catalog';
import { getFavoriteGenres, setFavoriteGenres } from '../services/mockApi';
import { colors, layout } from '../theme';

export default function HomeScreen() {
  const [searchVisible, setSearchVisible] = useState(false);
  const { tab } = useLocalSearchParams();
  const activeTab = tab === 'preferences' ? 'preferences' : 'all';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const savingRef = useRef(false);
  const pendingGenres = useRef(null);
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, layout.maxWidth);
  const loadHome = useCallback(() => getHomeContent({ personalized: activeTab === 'preferences' }), [activeTab]);
  const { data, loading, error, reload } = useAsyncResource(loadHome);
  const reloadHome = useRef(reload);
  useEffect(() => { reloadHome.current = reload; }, [reload]);
  const preferences = useAsyncResource(getFavoriteGenres);

  async function saveGenres(next) {
    if (savingRef.current) return false;
    savingRef.current = true;
    pendingGenres.current = next;
    setSaving(true);
    setSaveError(null);
    try {
      await setFavoriteGenres(next);
      await preferences.reload();
      void reloadHome.current();
      pendingGenres.current = null;
      return true;
    } catch (error) {
      setSaveError(error);
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        <AppHeader onSearch={() => setSearchVisible(true)} />
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View accessibilityRole="tablist" style={styles.tabs}>
              <Pressable accessibilityRole="tab" aria-selected={activeTab === 'all'} accessibilityState={{ selected: activeTab === 'all' }} onPress={() => router.setParams({ tab: 'all' })} style={[styles.tab, activeTab === 'all' && styles.activeTab]}><Text style={activeTab === 'all' ? styles.tabText : styles.inactiveText}>Все книги</Text></Pressable>
              <Pressable accessibilityRole="tab" aria-selected={activeTab === 'preferences'} accessibilityState={{ selected: activeTab === 'preferences' }} onPress={() => router.setParams({ tab: 'preferences' })} style={[styles.tab, activeTab === 'preferences' && styles.activeTab]}><Text style={activeTab === 'preferences' ? styles.tabText : styles.inactiveText}>Предпочтения</Text></Pressable>
            </View>
            {activeTab === 'preferences' && <FavoriteGenres value={preferences.data || []} busy={saving || preferences.loading} error={saveError || preferences.error} onChange={saveGenres} onRetry={() => pendingGenres.current ? saveGenres(pendingGenres.current) : preferences.reload()} />}
            <AsyncState loading={loading} error={error} onRetry={reload} />
            {!error && data?.lastRead && <ReadingReminder book={data.lastRead} />}
            {!error && data?.sections.map((section) => <BookSection key={section.id} {...section} width={width} />)}
          </ScrollView>
        </SafeAreaView>
      </View>
      <SearchPanel visible={searchVisible} onClose={() => setSearchVisible(false)} onSearch={(q) => router.push({ pathname: '/results', params: { mode: 'search', q } })} onDiscover={(filters) => router.push({ pathname: '/results', params: { mode: 'discover', filters: JSON.stringify(filters) } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  screen: { flex: 1, width: '100%', maxWidth: layout.maxWidth },
  body: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 24 },
  tabs: { flexDirection: 'row', backgroundColor: colors.segment, borderRadius: 24, height: 36, marginHorizontal: 16 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  activeTab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.accent },
  tabText: { color: colors.text, fontSize: 14 },
  inactiveText: { color: colors.secondary, fontSize: 14 },
});
