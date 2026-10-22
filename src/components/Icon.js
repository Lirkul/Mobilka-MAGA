import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

/** @param {{ name: string, size?: number, color?: string }} props */
export default function Icon({ name, size = 24, color = colors.secondary }) {
  const paths = {
    menu: 'M3 6h18M3 12h18M3 18h18',
    search: 'm16 16 5 5',
    mail: 'm3 5 9 7 9-7',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4',
    chat: 'M21 11.5c0 4.5-4 7.5-9 7.5a12 12 0 0 1-4-.7L3 21l1.2-5C2.8 14.7 2 13.2 2 11.5 2 7 6 4 12 4s9 3 9 7.5Z',
    book: 'M19 3H7a3 3 0 0 0-3 3v13a3 3 0 0 0 3 3h12V8H7a3 3 0 0 1 0-5M8 8v14m3-5 2-5 2 5m-3.5-1.5h3',
    flame: 'M12 2c1 5-5 7-5 12 0 3 2 6 5 7-2-3 1-5 2-8 2 2 3 5 2 8 4-2 6-5 4-10-1 2-2 3-3 3 1-5-2-9-5-12Z',
    down: 'm6 9 6 6 6-6',
    left: 'm15 6-6 6 6 6',
    close: 'm6 6 12 12M6 18 18 6',
    check: 'm5 12 4 4L19 6',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'search' && <Circle cx={10.5} cy={10.5} r={7} />}
      {name === 'mail' && <Rect x={2} y={4} width={20} height={16} rx={1.5} />}
      {name === 'avatar' ? (
        <>
          <Circle cx={12} cy={12} r={12} fill="#f5f5f5" stroke="none" />
          <Path d="M4 22c0-5 4-4 5-7-2-2-3-5-2-8 1-4 9-4 10 0 1 3 0 6-2 8 1 3 5 2 5 7" fill="#d6d6d6" stroke="none" />
        </>
      ) : <Path d={paths[name] || paths.search} />}
    </Svg>
  );
}
