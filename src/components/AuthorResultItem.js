import { useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { getAuthorAvatar } from '../data/imageSources';
import { setAuthorSubscription } from '../services/mockApi';
import { colors } from '../theme';

export default function AuthorResultItem({ author }) {
  const [subscribed, setSubscribed] = useState(author.subscribed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function toggle() {
    setSaving(true); setError('');
    try { const result = await setAuthorSubscription(author.id, !subscribed); setSubscribed(result.subscribed); }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  return <View style={styles.card}>
    <Pressable testID={`author-result-${author.id}`} accessibilityRole="button" accessibilityLabel={`Открыть автора ${author.name}`} onPress={() => router.push({ pathname: '/author/[id]', params: { id: author.id } })} style={styles.header}>
      <Image source={getAuthorAvatar(author.avatarKey)} accessibilityLabel={`Аватар ${author.name}`} style={styles.avatar} />
      <View style={styles.info}><Text style={styles.name}>{author.name}</Text><Text style={styles.secondary}>{author.rating.toLocaleString('ru-RU')} · {author.followers.toLocaleString('ru-RU')} подписчиков</Text><Text style={styles.secondary} numberOfLines={2}>{author.bio}</Text></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${subscribed ? 'Отписаться от' : 'Подписаться на'} ${author.name}`} disabled={saving} onPress={toggle} style={styles.button}><Text style={styles.label}>{saving ? 'Сохраняем…' : subscribed ? '✓ Вы подписаны' : '+ Подписаться'}</Text></Pressable>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { margin: 8, padding: 12, borderRadius: 12, backgroundColor: colors.segment, borderWidth: 1, borderColor: '#505050' },
  header: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatar: { width: 76, height: 76, borderRadius: 38 }, info: { flex: 1, gap: 8 },
  name: { color: colors.text, fontSize: 16, fontWeight: '500' },
  secondary: { color: colors.secondary, fontSize: 12, lineHeight: 17 },
  button: { borderWidth: 1, borderColor: colors.divider, minHeight: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 4, marginTop: 12 },
  label: { color: colors.text, fontSize: 13 }, error: { color: '#f3a99d', fontSize: 12, marginTop: 10 },
});
