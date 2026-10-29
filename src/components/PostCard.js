import { useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { getAuthorAvatar } from '../data/imageSources';
import { setPostReaction } from '../services/mockApi';
import { colors } from '../theme';

export default function PostCard({ post, author, onReaction = null }) {
  const [liked, setLiked] = useState(post.liked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function react() {
    setSaving(true); setError('');
    try { const response = await setPostReaction(post.id, !liked); setLiked(response.liked); onReaction?.(post.id, response.liked); }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  return <View style={styles.card}>
    <View style={styles.header}><Image source={getAuthorAvatar(author.avatarKey)} style={styles.avatar} /><View><Text style={styles.author}>{author.name}</Text><Text style={styles.date}>{new Date(post.publishedAt).toLocaleDateString('ru-RU')}</Text></View></View>
    <Text style={styles.title}>{post.title}</Text><Text style={styles.excerpt}>{post.excerpt}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Читать дальше: ${post.title}`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })} style={styles.read}><Text style={styles.label}>Читать дальше →</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Нравится пост «${post.title}»`} aria-pressed={!!liked} aria-selected={!!liked} accessibilityState={{ selected: !!liked }} disabled={saving} onPress={react} style={styles.reaction}><Text style={[styles.label, liked && styles.active]}>{liked ? '♥ +1' : '♡ Нравится'}</Text></Pressable>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.segment, borderWidth: 1, borderColor: '#505050', borderRadius: 12, padding: 14, marginHorizontal: 8, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 48, height: 48, borderRadius: 24 },
  author: { color: colors.text, fontSize: 14, fontWeight: '500' }, date: { color: '#999', fontSize: 12, marginTop: 6 },
  title: { color: colors.text, fontSize: 19, lineHeight: 25, marginTop: 14 }, excerpt: { color: colors.secondary, fontSize: 15, lineHeight: 24, marginVertical: 16 },
  read: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.text, fontSize: 14 }, reaction: { alignSelf: 'flex-start', paddingHorizontal: 10, minHeight: 44, justifyContent: 'center', marginTop: 8 },
  active: { color: colors.accent }, error: { color: '#f3a99d', fontSize: 12 },
});
