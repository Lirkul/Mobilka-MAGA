import { Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme';

export default function AppHeader({ onSearch }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.bar}>
        <View accessibilityLabel="Меню — будет доступно позже" style={styles.icon}>
          <Icon name="menu" />
        </View>
        <View style={styles.spacer} />
        <Pressable accessibilityRole="button" accessibilityLabel="Открыть поиск и подбор книг" onPress={onSearch} style={({ pressed }) => [styles.icon, pressed && styles.pressed]}>
          <Icon name="search" />
        </Pressable>
        <View accessibilityLabel="Сообщения" style={styles.icon}><Icon name="mail" /></View>
        <View accessibilityLabel="Уведомления: 999 и более" style={styles.icon}>
          <Icon name="bell" />
          <View style={styles.badge}><Text style={styles.badgeText}>999+</Text></View>
        </View>
        <View accessibilityLabel="Обсуждения" style={styles.icon}><Icon name="chat" /></View>
        <View accessibilityLabel="Профиль" style={styles.icon}><Icon name="avatar" size={32} /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.header },
  bar: { height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  spacer: { flex: 1 },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
  badge: { position: 'absolute', top: 3, left: 13, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#ce4c38' },
  badgeText: { color: colors.text, fontSize: 10, lineHeight: 14, fontWeight: '700' },
});
