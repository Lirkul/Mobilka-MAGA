import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import Text from './AppText';
import Icon from './Icon';

const shades = ['#2a6ea7', '#317bb5', '#2f75ad', '#3983bc', '#377eb5', '#3074aa'];
const facets = [];
const vertices = Array.from({ length: 6 }, (_, row) => Array.from({ length: 9 }, (_, column) => ({
  x: column * 45 + (column > 0 && column < 8 ? ((column * 13 + row * 7) % 21) - 10 : 0),
  y: row * 36 + (row > 0 && row < 5 ? ((column * 7 + row * 11) % 19) - 9 : 0),
})));
const point = (vertex) => `${vertex.x},${vertex.y}`;
for (let row = 0; row < 5; row += 1) {
  for (let column = 0; column < 8; column += 1) {
    const a = point(vertices[row][column]); const b = point(vertices[row][column + 1]);
    const c = point(vertices[row + 1][column]); const d = point(vertices[row + 1][column + 1]);
    facets.push({ points: `${a} ${b} ${(row + column) % 2 ? c : d}`, fill: shades[(row + column) % shades.length] });
    facets.push({ points: `${(row + column) % 2 ? b : a} ${d} ${c}`, fill: shades[(row * 2 + column + 2) % shades.length] });
  }
}
export default function UserBanner({ name }) {
  return <View style={styles.banner}>
    <Svg width="100%" height="100%" viewBox="0 0 360 180" preserveAspectRatio="none" style={StyleSheet.absoluteFill} aria-hidden>{facets.map((facet, index) => <Polygon key={index} {...facet} />)}</Svg>
    <View style={styles.avatar}><Icon name="avatar" size={56} /></View>
    <Text style={styles.name}>{name}</Text>
  </View>;
}
const styles = StyleSheet.create({
  banner: { minHeight: 140, padding: 16, paddingTop: 22, gap: 18, backgroundColor: '#337bb4' },
  avatar: { width: 56, height: 56 },
  name: { color: '#13191e', fontSize: 21, lineHeight: 27, textShadowColor: '#b3d0e4', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1 },
});
