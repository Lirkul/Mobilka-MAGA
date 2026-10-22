import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import DrawerShell from './DrawerShell';
import MenuRow from './MenuRow';
import MenuNotice from './MenuNotice';
import SearchPanel from './SearchPanel';
import { colors } from '../theme';

/** @type {Array<[string, string, Record<string, string> | null]>} */
const bookItems = [
  ['Популярные', 'heart', { sort: 'popularity' }], ['Новинки', 'flame', { sort: 'newest' }],
  ['Скидки', 'discount', null], ['Рекомендуемые', 'star', null], ['Подборки', 'folder', null],
  ['Подборки АТ', 'folder', null], ['Полный список жанров', 'documents', null], ['Расширенный поиск', 'searchMore', null],
];
const communityItems = [['ТОП авторов', 'chart'], ['ТОП пользователей', 'crown'], ['Иллюстрации', 'picture'], ['Форум АТ 2026', 'chat']];

export default function NavigationMenu({ visible, onClose }) {
  const [booksOpen, setBooksOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchMode, setSearchMode] = useState(null);
  function navigate(path) { close(); router.navigate(path); }
  function catalog(filters) { navigate({ pathname: '/results', params: { mode: 'discover', filters: JSON.stringify(filters) } }); }
  function openSearch(mode) { setSearchMode(mode); }
  function close() { setNotice(null); setSearchMode(null); onClose(); }
  function openSection(label) {
    if (label === 'Расширенный поиск') return openSearch('search');
    if (label === 'Полный список жанров') return openSearch('genres');
    if (label === 'Рекомендуемые') return navigate({ pathname: '/', params: { tab: 'preferences' } });
    setNotice({ title: label, description: 'Этот раздел ещё не реализован. Сейчас доступны каталог книг, поиск, библиотека, чтение и настройки.' });
  }
  const searchPanel = searchMode && <SearchPanel key={searchMode} embedded visible initialPickerKey={searchMode === 'genres' ? 'genres' : null} onClose={close} onSearch={(q) => { close(); router.navigate({ pathname: '/results', params: { mode: 'search', q } }); }} onDiscover={(filters) => { close(); router.navigate({ pathname: '/results', params: { mode: 'discover', filters: JSON.stringify(filters) } }); }} />;
  return (
    <DrawerShell visible={visible} onClose={close} overlayContent={searchPanel}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {notice ? <MenuNotice {...notice} onBack={() => setNotice(null)} /> : <>
          <Pressable accessibilityRole="button" accessibilityLabel="Главная" onPress={() => navigate('/')} style={styles.heading}>
            <Icon name="brand" size={32} color={colors.text} /><Text style={styles.brand}>Author.Today</Text>
          </Pressable>
          <MenuRow label="Книги" icon="openBook" expanded={booksOpen} onPress={() => setBooksOpen(!booksOpen)} />
          {booksOpen && bookItems.map(([label, icon, filters]) => <MenuRow key={label} label={label} icon={icon} nested onPress={() => filters ? catalog(filters) : openSection(label)} />)}
          <MenuRow label="Аудиокниги" icon="headphones" separated onPress={() => catalog({ format: 'audio' })} />
          <MenuRow label="Обсуждения" icon="discussion" separated onPress={() => openSection('Обсуждения')} />
          <MenuRow label="Сообщество" icon="community" expanded={communityOpen} onPress={() => setCommunityOpen(!communityOpen)} />
          {communityOpen && communityItems.map(([label, icon]) => <MenuRow key={label} label={label} icon={icon} nested onPress={() => openSection(label)} />)}
          <MenuRow label="Конкурсы" icon="trophy" badge="4" separated onPress={() => openSection('Конкурсы')} />
          <MenuRow label="Литмобы" icon="litmob" badge="9" separated onPress={() => openSection('Литмобы')} />
          <MenuRow label="Журнал АТ" icon="journal" separated onPress={() => openSection('Журнал АТ')} />
          <MenuRow label="Новости" icon="megaphone" separated onPress={() => openSection('Новости')} />
          <MenuRow label="Правила" icon="bookmark" onPress={() => openSection('Правила')} />
          <MenuRow label="Идеи и предложения" icon="bulb" onPress={() => openSection('Идеи и предложения')} />
          <MenuRow label="Справочный центр" icon="info" onPress={() => setNotice({ title: 'Справочный центр', description: 'Лупа открывает поиск и подбор книг. Статус книги выбирается в её карточке. Библиотека доступна через аватар пользователя; статусы и прогресс сохраняются после перезапуска.' })} />
          <MenuRow label="Общие настройки" icon="settings" separated onPress={() => navigate('/settings')} />
          <MenuRow label="Служба поддержки" icon="lifebuoy" onPress={() => setNotice({ title: 'Служба поддержки', description: 'Отправка обращений пока недоступна. За помощью по поиску и чтению откройте справочный центр.', action: 'Справочный центр', onAction: () => setNotice({ title: 'Справочный центр', description: 'Библиотека открывается через аватар. Чтобы продолжить чтение, нажмите «Читать» на карточке книги.' }) })} />
        </>}
      </ScrollView>
    </DrawerShell>
  );
}
const styles = StyleSheet.create({
  content: { paddingBottom: 16 },
  heading: { minHeight: 76, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { color: colors.text, fontSize: 22, flexShrink: 1 },
});
