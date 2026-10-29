import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Polygon } from 'react-native-svg';
import Text from '../../components/AppText';
import AsyncState from '../../components/AsyncState';
import BookCard from '../../components/BookCard';
import PostCard from '../../components/PostCard';
import ScreenFrame from '../../components/ScreenFrame';
import Icon from '../../components/Icon';
import { getAuthorAvatar, getBookCover } from '../../data/imageSources';
import useAsyncResource from '../../hooks/useAsyncResource';
import { getAuthorById, saveAuthorNote, setAuthorSubscription } from '../../services/mockApi';
import { toBookCard } from '../../services/catalog';
import { colors, fonts, layout } from '../../theme';

const tabs = [['profile', 'Профиль'], ['works', 'Произведения'], ['blog', 'Блог'], ['illustrations', 'Иллюстрации']];

export default function AuthorScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const tab = tabs.some(([key]) => key === params.tab) ? params.tab : 'profile';
  const loader = useCallback(() => getAuthorById(id), [id]);
  const { data, loading, error, reload } = useAsyncResource(loader);
  return <ScreenFrame title="Автор">
    <AsyncState loading={loading} error={error} onRetry={reload} />
    {data && !loading && !error && <AuthorContent key={data.id} author={data} tab={tab} />}
  </ScreenFrame>;
}

function AuthorContent({ author, tab }) {
  const { width } = useWindowDimensions();
  const cardWidth = (Math.min(width, layout.maxWidth) - 64) / 3;
  const [subscribed, setSubscribed] = useState(author.subscribed);
  const [note, setNote] = useState(author.note);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [illustration, setIllustration] = useState(null);
  const [reactions, setReactions] = useState(() => Object.fromEntries(author.posts.map((post) => [post.id, post.liked])));
  async function follow() {
    setSaving(true); setMessage('');
    try { const result = await setAuthorSubscription(author.id, !subscribed); setSubscribed(result.subscribed); }
    catch (failure) { setMessage(failure.message); }
    finally { setSaving(false); }
  }
  async function saveNote() {
    setSaving(true); setMessage('');
    try { await saveAuthorNote(author.id, note); setMessage('Заметка сохранена'); }
    catch (failure) { setMessage(failure.message); }
    finally { setSaving(false); }
  }
  return <>
    <ScrollView>
      <View style={styles.cover}>
        <Svg width="100%" height="100%" viewBox="0 0 480 160" preserveAspectRatio="none" style={StyleSheet.absoluteFill} aria-hidden>
          <Polygon points="0,0 180,0 90,160 0,160" fill="#568c9d" /><Polygon points="180,0 300,0 250,110 90,160" fill="#66c2b2" />
          <Polygon points="300,0 480,0 420,80 250,110" fill="#72d1bc" /><Polygon points="420,80 480,0 480,160 250,110" fill="#52758c" />
          <Polygon points="180,0 240,50 90,160" fill="#4fa8a7" /><Polygon points="0,160 250,110 480,160" fill="#526b87" />
        </Svg>
        <Image source={getAuthorAvatar(author.avatarKey)} style={styles.avatar} accessibilityLabel={`Аватар автора ${author.name}`} />
        <Text style={styles.name}>{author.name}</Text>
      </View>
      <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={subscribed ? 'Отписаться от автора' : 'Подписаться на автора'} disabled={saving} onPress={follow} style={styles.follow}><Text style={styles.followText}>{subscribed ? '✓ Вы подписаны' : '+ Подписаться'}</Text></Pressable></View>
      <View><ScrollView horizontal contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false}>{tabs.map(([key, label]) => <Pressable key={key} accessibilityRole="tab" aria-selected={tab === key} accessibilityState={{ selected: tab === key }} onPress={() => { setMessage(''); router.setParams({ tab: key }); }} style={[styles.tab, tab === key && styles.activeTab]}><Text style={[styles.tabText, tab === key && styles.active]}>{label}</Text></Pressable>)}</ScrollView></View>
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
      {tab === 'profile' && <View style={styles.profile}>
        <View style={styles.panel}><Text style={styles.heading}>Основная информация</Text><Text style={styles.bio}>{author.bio}</Text><Text style={styles.metric}>Подписчиков: {author.followers.toLocaleString('ru-RU')}</Text><Text style={styles.metric}>Рейтинг автора: {author.rating.toLocaleString('ru-RU')}</Text><Text style={styles.metric}>{author.specialty}</Text></View>
        <View style={styles.panel}><Text style={styles.heading}>Заметка</Text><Text style={styles.counter}>{note.length}/500</Text><TextInput accessibilityLabel="Заметка об авторе" placeholder="Напишите заметку о пользователе. Будет видна только вам" placeholderTextColor="#999" multiline maxLength={500} value={note} onChangeText={setNote} style={styles.note} /><Pressable accessibilityRole="button" disabled={saving} onPress={saveNote} style={styles.follow}><Text style={styles.followText}>Сохранить заметку</Text></Pressable></View>
      </View>}
      {tab === 'works' && <View><Text style={styles.sectionTitle}>Произведения · {author.books.length}</Text><View style={styles.grid}>{author.books.map((book) => <BookCard key={book.id} book={toBookCard(book)} width={cardWidth} authorGrid />)}</View>{!author.books.length && <Text style={styles.message}>Произведений пока нет</Text>}</View>}
      {tab === 'blog' && <View><Text style={styles.sectionTitle}>Записи в блогах · {author.posts.length}</Text>{author.posts.map((post) => <PostCard key={post.id} post={{ ...post, liked: reactions[post.id] }} author={author} onReaction={(id, liked) => setReactions((previous) => ({ ...previous, [id]: liked }))} />)}{!author.posts.length && <Text style={styles.message}>Записей пока нет</Text>}</View>}
      {tab === 'illustrations' && <View><Text style={styles.sectionTitle}>Иллюстрации · {author.illustrations.length}</Text><Text style={styles.hint}>Учебная галерея оформления книг</Text><View style={styles.artGrid}>{author.illustrations.map((art) => <Pressable key={art.id} accessibilityRole="button" accessibilityLabel={`Открыть иллюстрацию «${art.title}»`} onPress={() => setIllustration(art)} style={styles.art}><Image source={getBookCover(art.coverKey)} style={styles.artImage} /><View style={styles.caption}><Text style={styles.artTitle} numberOfLines={2}>{art.title}</Text><Text style={styles.artAuthor}>{author.name}</Text></View></Pressable>)}</View></View>}
    </ScrollView>
    <Modal transparent visible={!!illustration} animationType="fade" onRequestClose={() => setIllustration(null)}><View style={styles.lightbox}><Pressable accessibilityRole="button" accessibilityLabel="Закрыть иллюстрацию" onPress={() => setIllustration(null)} style={styles.close}><Icon name="close" size={28} /></Pressable>{illustration && <><Image source={getBookCover(illustration.coverKey)} resizeMode="contain" style={styles.fullImage} /><Text style={styles.artTitle}>{illustration.title}</Text><Pressable accessibilityRole="button" onPress={() => { const id = illustration.bookId; setIllustration(null); router.push({ pathname: '/book/[id]', params: { id } }); }} style={styles.follow}><Text style={styles.active}>Открыть книгу</Text></Pressable></>}</View></Modal>
  </>;
}
const styles = StyleSheet.create({
  cover: { height: 150, backgroundColor: '#548f9c', flexDirection: 'row', alignItems: 'flex-end', padding: 16, gap: 16 },
  avatar: { width: 76, height: 76, borderRadius: 8, borderWidth: 2, borderColor: '#fff' }, name: { flex: 1, color: '#fff', fontSize: 22, fontWeight: '700', paddingBottom: 12 },
  actions: { padding: 10, backgroundColor: '#202124' }, follow: { minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  followText: { color: colors.text, fontSize: 15 }, tabs: { backgroundColor: colors.segment }, tab: { minHeight: 50, paddingHorizontal: 14, justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' }, activeTab: { borderColor: colors.accent },
  tabText: { color: colors.secondary, fontSize: 14 }, active: { color: colors.accent }, profile: { padding: 8, gap: 12 }, panel: { borderRadius: 12, backgroundColor: colors.segment, borderWidth: 1, borderColor: '#505050', padding: 16 },
  heading: { color: colors.text, fontSize: 19, marginBottom: 16 }, bio: { color: colors.text, fontSize: 15, lineHeight: 23, marginBottom: 16 }, metric: { color: colors.secondary, fontSize: 14, lineHeight: 26 },
  note: { fontFamily: fonts.regular, color: colors.text, fontSize: 14, lineHeight: 21, minHeight: 90, borderWidth: 1, borderColor: colors.divider, padding: 12, borderRadius: 5, marginBottom: 12, textAlignVertical: 'top' },
  counter: { color: colors.secondary, textAlign: 'right', fontSize: 13, marginBottom: 8 }, message: { color: colors.secondary, padding: 16, fontSize: 14 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', padding: 16 }, grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
  artGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 }, art: { width: '48%', height: 210 }, artImage: { width: '100%', height: '100%' }, caption: { position: 'absolute', bottom: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.55)', width: '100%' },
  artTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, artAuthor: { color: colors.text, fontSize: 12, marginTop: 6 }, hint: { color: colors.secondary, fontSize: 12, paddingHorizontal: 16 },
  lightbox: { flex: 1, backgroundColor: '#151515', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 }, close: { position: 'absolute', right: 16, top: 35, padding: 12, zIndex: 2 }, fullImage: { width: '100%', height: '70%' },
});
