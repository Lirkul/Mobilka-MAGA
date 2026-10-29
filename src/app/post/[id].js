import { useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Text from '../../components/AppText';
import AsyncState from '../../components/AsyncState';
import ScreenFrame from '../../components/ScreenFrame';
import { getAuthorAvatar } from '../../data/imageSources';
import useAsyncResource from '../../hooks/useAsyncResource';
import { getPostById } from '../../services/mockApi';
import { colors } from '../../theme';

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id;
  const loader = useCallback(() => getPostById(postId), [postId]);
  const { data: post, loading, error, reload } = useAsyncResource(loader);

  return (
    <ScreenFrame title="Пост" scroll>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && post && (
        <View style={styles.content}>
          {post.author && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Открыть автора ${post.author.name}`}
              onPress={() => router.push({ pathname: '/author/[id]', params: { id: post.author.id } })}
              style={styles.author}
            >
              <Image source={getAuthorAvatar(post.author.avatarKey)} style={styles.avatar} />
              <View style={styles.byline}>
                <Text style={styles.authorName}>{post.author.name}</Text>
                <Text style={styles.date}>{new Date(post.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
            </Pressable>
          )}
          <Text style={styles.title}>{post.title}</Text>
          <Text selectable style={styles.body}>{post.excerpt}</Text>
        </View>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 8 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, marginBottom: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  byline: { flex: 1, gap: 6 },
  authorName: { color: colors.accent, fontSize: 16, fontWeight: '500' },
  date: { color: colors.secondary, fontSize: 13 },
  title: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: '700', marginBottom: 24 },
  body: { color: colors.text, fontSize: 17, lineHeight: 28 },
});
