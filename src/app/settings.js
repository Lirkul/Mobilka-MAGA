import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import ScreenFrame from '../components/ScreenFrame';
import AsyncState from '../components/AsyncState';
import Text from '../components/AppText';
import useAsyncResource from '../hooks/useAsyncResource';
import { getSettings, updateSettings, mockApiControl } from '../services/mockApi';
import { colors } from '../theme';

export default function SettingsScreen() {
  const { data, loading, error, reload } = useAsyncResource(getSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function change(value) {
    setSaving(true); setMessage('');
    try { await updateSettings(value); await reload(); }
    catch (failure) { setMessage(failure.message); }
    finally { setSaving(false); }
  }
  return (
    <ScreenFrame title="Настройки" scroll>
      <AsyncState loading={loading && !data} error={error} onRetry={reload} />
      {data && <>
        <Text style={styles.heading}>Учебные настройки</Text>
        <Text style={styles.hint}>Эти параметры имитируют ответы локального API. Физическое подключение устройства не меняется.</Text>
        <View style={styles.row}><View style={styles.description}><Text style={styles.label}>Имитация отсутствия интернета</Text><Text style={styles.hint}>{data.offline ? 'Сеть отключена' : 'Сеть включена'}</Text></View><Switch accessibilityLabel="Имитация отсутствия интернета" value={data.offline} disabled={saving} onValueChange={(offline) => change({ offline })} trackColor={{ true: colors.accent }} /></View>
        <View style={styles.row}><View style={styles.description}><Text style={styles.label}>Пустая выдача</Text><Text style={styles.hint}>Проверка состояния без результатов</Text></View><Switch accessibilityLabel="Пустая выдача" value={data.emptyResults} disabled={saving} onValueChange={(emptyResults) => change({ emptyResults })} trackColor={{ true: colors.accent }} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Задержка ответа" disabled={saving} onPress={() => change({ latencyMs: data.latencyMs === 240 ? 1500 : 240 })} style={styles.row}><Text style={styles.label}>Задержка ответа</Text><Text style={styles.link}>{data.latencyMs} мс</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { mockApiControl.failNextRequest({ networkOnly: true }); setMessage('Следующий запрос каталога или поиска завершится ошибкой. После неё можно повторить запрос.'); }} style={styles.button}><Text style={styles.link}>Ошибка следующего запроса</Text></Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
        <Text style={styles.hint}>Библиотека, статусы, главы, прогресс и настройки читалки сохраняются на устройстве и доступны при имитации offline.</Text>
      </>}
    </ScreenFrame>
  );
}
const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  hint: { color: colors.secondary, fontSize: 13, lineHeight: 20 },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderColor: colors.divider, paddingVertical: 14 },
  description: { flex: 1, gap: 8 },
  label: { color: colors.text, fontSize: 15, lineHeight: 22 },
  link: { color: colors.accent, fontSize: 14 },
  button: { borderWidth: 1, borderColor: colors.accent, minHeight: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  message: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginVertical: 16 },
});
