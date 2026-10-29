import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import ScreenFrame from '../components/ScreenFrame';
import AsyncState from '../components/AsyncState';
import Text from '../components/AppText';
import useAsyncResource from '../hooks/useAsyncResource';
import { getSettings, updateSettings } from '../services/mockApi';
import { colors } from '../theme';

async function loadSettings() {
  const settings = await getSettings();
  // A removed switch must not leave a saved empty-results simulation enabled.
  return settings.emptyResults ? updateSettings({ emptyResults: false }) : settings;
}

export default function SettingsScreen() {
  const { data, loading, error, reload } = useAsyncResource(loadSettings);
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
        <View style={styles.row}><View style={styles.description}><Text style={styles.label}>Имитация отсутствия интернета</Text><Text style={styles.hint}>{data.offline ? 'Сеть отключена' : 'Сеть включена'}</Text></View><Switch accessibilityLabel="Имитация отсутствия интернета" value={data.offline} disabled={saving} onValueChange={(offline) => change({ offline })} trackColor={{ true: colors.accent }} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Задержка ответа" disabled={saving} onPress={() => change({ latencyMs: data.latencyMs === 240 ? 1500 : 240 })} style={styles.row}><Text style={styles.label}>Задержка ответа</Text><Text style={styles.link}>{data.latencyMs} мс</Text></Pressable>
        {!!message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
      </>}
    </ScreenFrame>
  );
}
const styles = StyleSheet.create({
  hint: { color: colors.secondary, fontSize: 13, lineHeight: 20 },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderColor: colors.divider, paddingVertical: 14 },
  description: { flex: 1, gap: 8 },
  label: { color: colors.text, fontSize: 15, lineHeight: 22 },
  link: { color: colors.accent, fontSize: 14 },
  message: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginVertical: 16 },
});
