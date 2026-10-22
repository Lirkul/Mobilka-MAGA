import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Text from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import BookSection from '../components/BookSection';
import ReadingReminder from '../components/ReadingReminder';
import SearchPanel from '../components/SearchPanel';
import { homeSections } from '../data/books';
import { discoverBooks, searchBooksByTitle } from '../services/catalog';
import { colors, layout } from '../theme';

export default function HomeScreen() {
  const [searchVisible, setSearchVisible] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, layout.maxWidth);

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        <AppHeader onSearch={() => setSearchVisible(true)} />
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View accessibilityRole="tablist" style={styles.tabs}>
              <View accessibilityRole="tab" accessibilityState={{ selected: true }} style={styles.activeTab}><Text style={styles.tabText}>Все книги</Text></View>
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: false }} accessibilityLabel="Предпочтения — подобрать книги по интересам" onPress={() => setSearchVisible(true)} style={styles.tab}><Text style={styles.inactiveText}>Предпочтения</Text></Pressable>
            </View>
            <ReadingReminder />
            {homeSections.map((section) => <BookSection key={section.id} {...section} width={width} />)}
          </ScrollView>
        </SafeAreaView>
      </View>
      <SearchPanel visible={searchVisible} onClose={() => setSearchVisible(false)} onSearchByTitle={searchBooksByTitle} onDiscover={discoverBooks} />
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
