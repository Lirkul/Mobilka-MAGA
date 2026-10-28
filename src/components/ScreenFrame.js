import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import Icon from './Icon';
import { colors, layout } from '../theme';
import { useState } from 'react';
import NavigationMenu from './NavigationMenu';
import UserMenu from './UserMenu';
import AppHeader from './AppHeader';
import SearchPanel from './SearchPanel';

export default function ScreenFrame({ title, children, scroll = false, headerActions = null, headerTitle = null, accentBack = false, catalogHeader = false, onSearch = null, lightHeader = false, headerHidden = false }) {
  const [menu, setMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  return (
    <View style={styles.outer}>
      <SafeAreaView edges={catalogHeader ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={[styles.screen, lightHeader && styles.lightScreen]}>
        {!headerHidden && (catalogHeader ? <AppHeader onBack={goBack} onSearch={onSearch || (() => setSearchVisible(true))} /> : <View style={[styles.bar, lightHeader && styles.lightBar]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={goBack} style={styles.back}><Icon name="left" color={accentBack ? colors.accent : colors.secondary} /></Pressable>
          {headerTitle || <Text accessibilityRole="header" style={[styles.title, lightHeader && styles.lightTitle]} numberOfLines={1}>{title}</Text>}
          {headerActions || <>
          <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню" onPress={() => setMenu(true)} style={styles.back}><Icon name="menu" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню пользователя" onPress={() => setUserMenu(true)} style={styles.back}><Icon name="avatar" size={30} /></Pressable>
          </>}
        </View>)}
        {scroll ? <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView> : <View style={styles.body}>{children}</View>}
      </SafeAreaView>
      <NavigationMenu visible={menu} onClose={() => setMenu(false)} />
      <UserMenu visible={userMenu} onClose={() => setUserMenu(false)} />
      {catalogHeader && <SearchPanel visible={searchVisible} onClose={() => setSearchVisible(false)} onSearch={(q) => router.push({ pathname: '/results', params: { mode: 'search', q } })} onDiscover={(filters) => router.push({ pathname: '/results', params: { mode: 'discover', filters: JSON.stringify(filters) } })} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: colors.background },
  screen: { flex: 1, width: '100%', maxWidth: layout.maxWidth, backgroundColor: colors.background },
  lightScreen: { backgroundColor: '#ffffff' },
  bar: { height: 50, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.header, paddingRight: 16 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500' },
  lightBar: { backgroundColor: '#ffffff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d8d8d4', paddingRight: 4 },
  lightTitle: { color: '#484844', fontSize: 13, fontWeight: '400' },
  content: { padding: 16, paddingBottom: 32 },
  body: { flex: 1 },
});
