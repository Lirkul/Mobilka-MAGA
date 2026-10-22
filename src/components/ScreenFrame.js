import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import Icon from './Icon';
import { colors, layout } from '../theme';
import { useState } from 'react';
import NavigationMenu from './NavigationMenu';
import UserMenu from './UserMenu';

export default function ScreenFrame({ title, children, scroll = false, headerActions = null, headerTitle = null, accentBack = false }) {
  const [menu, setMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  return (
    <View style={styles.outer}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} style={styles.back}><Icon name="left" color={accentBack ? colors.accent : colors.secondary} /></Pressable>
          {headerTitle || <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>{title}</Text>}
          {headerActions || <>
          <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню" onPress={() => setMenu(true)} style={styles.back}><Icon name="menu" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню пользователя" onPress={() => setUserMenu(true)} style={styles.back}><Icon name="avatar" size={30} /></Pressable>
          </>}
        </View>
        {scroll ? <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView> : <View style={styles.body}>{children}</View>}
      </SafeAreaView>
      <NavigationMenu visible={menu} onClose={() => setMenu(false)} />
      <UserMenu visible={userMenu} onClose={() => setUserMenu(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: colors.background },
  screen: { flex: 1, width: '100%', maxWidth: layout.maxWidth, backgroundColor: colors.background },
  bar: { height: 50, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.header, paddingRight: 16 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 32 },
  body: { flex: 1 },
});
