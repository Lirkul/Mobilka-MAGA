import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Text from './AppText';
import { colors } from '../theme';

// Native vector illustration: no screenshot or cropped reference asset.
export default function EmptyState({ message = 'К сожалению, по вашему запросу ничего не найдено' }) {
  return <View testID="empty-state" style={styles.container}>
    <View style={styles.art}>
      <Svg width={210} height={200} viewBox="0 0 240 230" aria-hidden>
        <Ellipse cx={120} cy={210} rx={90} ry={10} fill="#173b4a" />
        <Path d="M25 185 47 165l22 15 29-28 35 26 34-20 40 30-17 17H36Z" fill="#a4dae8" />
        <Ellipse cx={126} cy={142} rx={52} ry={59} fill="#4286a7" />
        <Ellipse cx={126} cy={160} rx={34} ry={34} fill="#95cadb" />
        <Path d="m77 132-26 32 37 1M173 132l29 27-31 9M82 100l1-35 34 27m20 0 31-30 4 41" fill="#397793" />
        <Circle cx={104} cy={117} r={22} fill="#c9e9ed" /><Circle cx={147} cy={117} r={22} fill="#c9e9ed" />
        <Circle cx={109} cy={120} r={9} fill="#18374d" /><Circle cx={142} cy={120} r={9} fill="#18374d" />
        <Circle cx={112} cy={117} r={3} fill="white" /><Circle cx={145} cy={117} r={3} fill="white" />
        <Path d="m120 135 7 11 8-12M98 197l-6 10m57-10 7 10" fill="#ffc05f" stroke="#ffc05f" strokeWidth={3} />
        <Circle cx={55} cy={59} r={7} fill="#c9edf4" /><Circle cx={68} cy={52} r={11} fill="#c9edf4" /><Circle cx={80} cy={58} r={7} fill="#c9edf4" />
        <Circle cx={193} cy={101} r={6} fill="#c9edf4" /><Circle cx={204} cy={97} r={9} fill="#c9edf4" />
      </Svg>
      <Text style={styles.code}>404</Text>
    </View>
    <Text style={styles.message}>{message}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'space-around', padding: 24 },
  art: { position: 'relative' },
  code: { position: 'absolute', bottom: 6, left: 73, color: '#33728d', fontSize: 34, fontWeight: '700', transform: [{ rotate: '-10deg' }] },
  message: { color: colors.text, fontSize: 14, lineHeight: 20, maxWidth: 300, textAlign: 'center', marginTop: 40 },
});
