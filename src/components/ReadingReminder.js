import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { colors } from '../theme';

export default function ReadingReminder() {
  return (
    <View style={styles.card}>
      <View style={styles.icon}><Icon name="book" color="#fff" size={22} /></View>
      <View style={styles.row}>
        <Text style={styles.label}>Вы читали</Text>
        <Text style={styles.date}>27 июля в 19:05</Text>
      </View>
      <Text style={styles.book}>Роман «Против течения: вторая жизнь Ирены»</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, padding: 16, paddingLeft: 36, minHeight: 103, backgroundColor: colors.card, borderRadius: 6 },
  icon: { position: 'absolute', left: -8, top: 10, width: 32, height: 32, backgroundColor: '#9178db', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 },
  label: { color: colors.text, fontWeight: '700', fontSize: 15, lineHeight: 19 },
  date: { color: colors.secondary, fontSize: 15, lineHeight: 19 },
  book: { color: colors.text, fontSize: 15, lineHeight: 20, marginTop: 12 },
});
