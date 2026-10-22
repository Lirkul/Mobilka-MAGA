import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import DrawerShell from './DrawerShell';
import MenuRow from './MenuRow';
import MenuNotice from './MenuNotice';
import UserBanner from './UserBanner';
import Text from './AppText';
import useAsyncResource from '../hooks/useAsyncResource';
import { currentUser } from '../data/currentUser';
import { getCurrentUser, setSignedIn } from '../services/mockApi';

export default function UserMenu({ visible, onClose }) {
  const { data, reload } = useAsyncResource(getCurrentUser);
  const [notice, setNotice] = useState(null);
  const [adding, setAdding] = useState(false);
  const [account, setAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const signedIn = data?.signedIn !== false;
  function navigate(path) { close(); router.navigate(path); }
  function close() { setNotice(null); setError(''); onClose(); }
  async function signIn(value) {
    if (saving) return;
    setSaving(true); setError('');
    try { await setSignedIn(value); await reload(); setNotice(null); }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  function confirmExit() { setNotice({ title: 'Выйти из аккаунта?', description: 'Библиотека и прогресс останутся на этом устройстве.', action: saving ? 'Сохраняем…' : 'Выйти', onAction: () => signIn(false) }); }
  function profile() { setNotice({ title: 'Мой профиль', description: `${currentUser.name}\nЧитатель`, action: 'Моя библиотека', onAction: () => navigate('/library') }); }
  return <DrawerShell visible={visible} side="right" onClose={close} onShow={() => { void reload(); }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <UserBanner name={signedIn ? currentUser.name : 'Гость'} />
      {notice ? <MenuNotice {...notice} onBack={() => { setNotice(null); setError(''); }} /> : <>
        <MenuRow label="Моя библиотека" icon="library" onPress={() => navigate('/library')} />
        {signedIn ? <>
          <MenuRow label="Приватность" icon="shield" onPress={() => setNotice({ title: 'Приватность', description: 'Настройки приватности пока недоступны. Библиотека и заметки сохраняются только на этом устройстве.' })} />
          <MenuRow label="Игнор-лист" icon="mute" onPress={() => setNotice({ title: 'Игнор-лист', description: 'В игнор-листе пока никого нет.' })} />
          <MenuRow label="Кошелек" icon="coins" separated onPress={() => setNotice({ title: 'Кошелек', description: 'Баланс: 0 ₽\nПополнение и покупки пока недоступны.' })} />
          <MenuRow label="Добавить" icon="plus" separated expanded={adding} onPress={() => setAdding(!adding)} />
          {adding && ['Произведение', 'Пост', 'Иллюстрацию'].map((label) => <MenuRow key={label} label={label} icon="plus" nested onPress={() => setNotice({ title: `Добавить: ${label.toLowerCase()}`, description: 'Публикация материалов пока недоступна.' })} />)}
          <MenuRow label="Мои подборки" icon="addCollection" separated onPress={() => setNotice({ title: 'Мои подборки', description: 'У вас пока нет подборок.', action: 'Моя библиотека', onAction: () => navigate('/library') })} />
          <MenuRow label="Мой профиль" icon="profile" onPress={profile} />
          <MenuRow label="Учетная запись" icon="user" expanded={account} onPress={() => setAccount(!account)} />
          {account && <MenuRow label={currentUser.name} icon="profile" nested onPress={profile} />}
          <MenuRow label="Выйти" icon="logout" separated onPress={confirmExit} />
        </> : <MenuRow label={`Войти как ${currentUser.name}`} icon="user" separated onPress={() => signIn(true)} />}
      </>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </ScrollView>
  </DrawerShell>;
}
const styles = StyleSheet.create({ content: { paddingBottom: 16 }, error: { color: '#f3a99d', fontSize: 13, padding: 16 } });
