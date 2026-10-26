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
    up: 'm6 15 6-6 6 6',
    left: 'm15 6-6 6 6 6',
    right: 'm9 6 6 6-6 6',
    close: 'm6 6 12 12M6 18 18 6',
    check: 'm5 12 4 4L19 6',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3l-1 3-3 1-2 3 2 2-1 3 3 3 3-1 2 3 3-1 1-3 3-1 2-3-2-2 1-3-3-3-3 1-2-3Z',
    wifiOff: 'M2 8c5-5 15-5 20 0M5 12c4-4 10-4 14 0M9 16c2-2 4-2 6 0M12 20h.01M3 3l18 18',
    reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
    wand: 'm3 18 13-13 3 3L6 21ZM13 8l3 3M5 2v6M2 5h6M20 13v6M17 16h6',
    ufo: 'M7 11c-1-2 0-7 5-7s6 5 5 7M4 12c-5 6 21 6 16 0-3-3-13-3-16 0ZM7 18l-2 3m12-3 2 3M8 12h.01M12 13h.01M16 12h.01',
    rocket: 'M9 15c-1-5 3-11 12-12 0 9-6 13-12 12Zm0 0-4 4m5-9H5l-3 6 6-1m6-1v5l-6 3 1-6M16 7h.01M5 19l-2 2',
    hearts: 'M12 8C5-4-4 10 12 20m0-12c5-8 13-2 8 4M17 15c-4-6-9 0 0 7 9-7 4-13 0-7Z',
    unicorn: 'm7 8 13-5-7 8 5 5-4 3-5-3c-1 4 1 6 3 7-11-1-12-12-5-15Zm0 0 3 4m2-5-1 5m2 0h.01',
    crystal: 'M5 18a9 9 0 1 1 14 0M7 9c0-2 1-3 3-3M5 18h14l2 4H3Z',
    city: 'M4 22V5l9-3v20M13 8l7 4v10M2 22h20M8 7h.01M8 11h.01M8 15h.01M8 19h.01M16 14h.01M16 18h.01',
    compass: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM16 8l-3 5-5 3 3-5ZM12 2v3m10 7h-3m-7 10v-3M2 12h3',
    feather: 'M3 21 15 9M4 20l2-8 9-9c7-4 9 2 6 5l-9 9ZM8 10l6 6m-2-10 6 6',
    smile: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM7 14c2 5 8 5 10 0ZM8 8h.01M16 8h.01',
    skull: 'M6 17C-2 5 6 2 12 2s14 3 6 15v5H6ZM9 18v4m6-4v4M8 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 15v1',
    knife: 'm4 20 13-17 5 1-9 12 4 3c-3 3-9 3-13 1Z',
    grid: 'M3 3h6v6H3ZM15 3h6v6h-6ZM3 15h6v6H3Zm15-1 5 5-5 5-5-5Z',
    bomb: 'M15 5c-6-4-14 2-12 9 2 9 15 10 17 1 1-3 0-5-2-7l2-3-3-2ZM17 3l3-2 2 2M7 10l2-2',
    graduation: 'm1 8 11-5 11 5-11 5Zm5 3v7c4 3 8 3 12 0v-7m5-3v9',
    swords: 'm3 2 4 1 14 15-3 3L3 6Zm14 1 4-1v4l-5 5M9 14l-6 7m-1-5 6 6m8-6 6 6',
    goggles: 'M5 2 2 15v6h6l3-4h2l3 4h6v-6L19 2h-3M2 14h20M6 18h.01M18 18h.01',
    castle: 'M4 22V3h4v4h3V3h3v4h3V3h4v7l-3 3v9ZM10 22v-7h4v7',
    masks: 'M2 3h12v7C11 18 2 15 2 9Zm7 7H6M5 6h.01M11 6h.01M12 9h10v7c-2 8-10 6-12 0m4 0c1 2 3 2 4 0M14 12h.01M20 12h.01',
    brand: 'M12 14c-3-2-5-2-7-1v7c3-1 5 0 7 2 2-2 4-3 7-2v-7c-2-1-4-1-7 1Zm0 0v8M6 12C0 10 1 4 3 2c-1 4 2 6 4 6C4 6 5 3 6 2c0 4 5 4 5 8m7 2c6-2 5-8 3-10 1 4-2 6-4 6 3-2 2-5 1-6 0 4-5 4-5 8M10 7l1-4 4-1-2 3 2 2',
    openBook: 'M12 5C8 2 4 3 1 4v16c4-2 7-1 11 1 4-2 7-3 11-1V4c-3-1-7-2-11 1Zm0 0v16M4 6v11m16-11v11',
    library: 'M3 6h4v16H3Zm7-4h4v20h-4Zm7 3 4-1 4 17-4 1Z',
    heart: 'M12 21C-7 8 4-4 12 5 20-4 31 8 12 21Z',
    discount: 'm12 2 3 2h4l1 4 2 4-2 4-1 4h-4l-3 2-3-2H5l-1-4-2-4 2-4 1-4h4ZM8 16l8-8M8 8h.01M16 16h.01',
    star: 'm12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z',
    folder: 'M2 5h8l2 3h10v14H2ZM2 10h20',
    documents: 'M5 2h12v16H5ZM9 6h5m-5 4h5m-5 4h5M17 6h4v16H9v-4',
    searchMore: 'M16 16l6 6M17 9a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM2 22h.01M6 22h.01M10 22h.01',
    headphones: 'M2 14v-3a10 10 0 0 1 20 0v3M3 12h4v10H3ZM17 12h4v10h-4Z',
    discussion: 'M3 3h18v15H9l-6 5ZM7 7h10M7 11h10M7 15h6',
    community: 'M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-4 9V9c0-3 8-3 8 0v2ZM4 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-3 8c0-5 6-5 6 0Zm19-8a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-3 8c0-5 6-5 6 0ZM12 11v5m0-3-5 3m5-3 5 3',
    chart: 'M2 21h21M4 13h4v6H4Zm7-10h4v16h-4Zm7 5h4v11h-4Z',
    crown: 'm2 6 5 5 5-8 5 8 5-5-3 14H5Zm3 10h14',
    picture: 'M3 2h18v20H3ZM3 16l6-7 6 7 3-3 3 3M17 6h.01',
    trophy: 'M7 2h10v6c0 9-10 9-10 0Zm0 2H2v3c0 5 5 5 5 5m10-8h5v3c0 5-5 5-5 5M12 14v5m-4 0h8l2 3H6Z',
    litmob: 'M10 2h4m-2 0v4M7 5a9 9 0 1 0 12 13M12 9v6l-3 2M5 21 22 4c1 6-4 12-10 13',
    journal: 'm4 6 14 3v13L4 19Zm-3 3v13l14 2M7 12l8 2v5l-8-2ZM8 2l15 3v13l-5 1',
    megaphone: 'M3 8h5l12-6v20L8 16H3Zm5 0v8m-3 0 2 7h4l-3-7M23 7v8',
    bookmark: 'M5 2h14v21l-7-6-7 6Z',
    bulb: 'M8 18c0-6-9-9-3-14 5-5 13-2 13 3 0 5-3 6-3 11ZM8 21h7m-6 3h5M8 6l2-2',
    info: 'M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM10 9h4v14h-4Z',
    lifebuoy: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-5 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM5 5l3.5 3.5M15.5 15.5 19 19M5 19l3.5-3.5M15.5 8.5 19 5',
    shield: 'M12 2 2 6c0 9 3 13 10 17 7-4 10-8 10-17ZM12 10v5',
    mute: 'M3 9h4l6-6v18l-6-6H3Zm15-1 5 7m-5 0 5-7',
    coins: 'M2 5c0-4 12-4 12 0s-12 4-12 0Zm0 0v13c0 3 5 4 7 3M8 8v7m2-1c0-4 12-4 12 0s-12 4-12 0Zm0 0v7c0 4 12 4 12 0v-7',
    plus: 'M12 3v18M3 12h18',
    addCollection: 'M7 2h15v15H7ZM2 7h5v10h10v5H2ZM10 9h9m-4-4v9',
    user: 'M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM3 23v-5c0-7 18-7 18 0v5',
    profile: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM5 19c0-8 14-8 14 0',
    logout: 'M10 2H2v20h8m5-15 7 5-7 5m-8-5h15',
    sparkles: 'm8 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2Zm11 11 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z',
    pencil: 'm3 17 13-14 5 5L8 21H3Zm10-11 5 5',
    cloudCheck: 'M12 18H6C-1 18 0 8 6 8 6 0 19 1 19 9c5-1 6 7 2 8m-8 4 3 3 6-7',
    reading: 'M5 2h14v20H5ZM9 2v8l3-2 3 2V2',
    clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 5v7h6',
    doubleCheck: 'm2 12 5 5L18 5M9 14l3 3L23 5',
    ruble: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM10 19V6h4c5 0 5 7 0 7H8m0 3h8',
    eyeOff: 'M2 12c6-9 14-9 20 0-6 9-14 9-20 0ZM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM3 22 22 2',
    eye: 'M2 12c6-9 14-9 20 0-6 9-14 9-20 0ZM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',
    filter: 'M2 3h20l-8 9v8l-4 3V12Z',
    sort: 'M3 5h18M3 12h12M3 19h6',
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
