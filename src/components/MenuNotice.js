import { Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

export default function MenuNotice({ title, description, onBack, action = null, onAction = null, children = null }) {
  return <View style={styles.body}>
    <Pressable accessibilityRole="button" accessibilityLabel="Назад к меню" onPress={onBack} style={styles.back}><Icon name="left" /><Text style={styles.link}>Назад к меню</Text></Pressable>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {children}
    {action && <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}><Text style={styles.link}>{action}</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 }, back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: colors.text, fontSize: 21 }, description: { color: colors.secondary, fontSize: 14, lineHeight: 21 },
  link: { color: colors.accent, fontSize: 14 }, action: { minHeight: 44, borderWidth: 1, borderColor: colors.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
});
