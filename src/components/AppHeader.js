import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme';
import { useState } from 'react';
import NavigationMenu from './NavigationMenu';
import UserMenu from './UserMenu';

export default function AppHeader({ onSearch, onBack = null }) {
  const showBack = onBack && Platform.OS === 'web';
  const [menu, setMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.bar}>
        {showBack && <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={onBack} style={[styles.icon, styles.compact]}><Icon name="left" color={colors.accent} /></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню" onPress={() => setMenu(true)} style={[styles.icon, showBack && styles.compact]}>
          <Icon name="menu" />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable accessibilityRole="button" accessibilityLabel="Открыть поиск и подбор книг" onPress={onSearch} style={({ pressed }) => [styles.icon, showBack && styles.compact, pressed && styles.pressed]}>
          <Icon name="search" />
        </Pressable>
        <View accessibilityLabel="Сообщения" style={[styles.icon, showBack && styles.compact]}><Icon name="mail" /></View>
        <View accessibilityLabel="Уведомления: 999 и более" style={[styles.icon, showBack && styles.compact]}>
          <Icon name="bell" />
          <View style={styles.badge}><Text style={styles.badgeText}>999+</Text></View>
        </View>
        <View accessibilityLabel="Обсуждения" style={[styles.icon, showBack && styles.compact]}><Icon name="chat" /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню пользователя" onPress={() => setUserMenu(true)} style={[styles.icon, showBack && styles.compact]}><Icon name="avatar" size={32} /></Pressable>
      </View>
      <NavigationMenu visible={menu} onClose={() => setMenu(false)} />
      <UserMenu visible={userMenu} onClose={() => setUserMenu(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.header },
  bar: { height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  spacer: { flex: 1 },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  compact: { width: 44 },
  pressed: { opacity: 0.55 },
  badge: { position: 'absolute', top: 3, left: 13, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#ce4c38' },
  badgeText: { color: colors.text, fontSize: 10, lineHeight: 14, fontWeight: '700' },
});
