import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './AppText';
import Icon from './Icon';
import Slider from './Slider';
import MotionSurface from './MotionSurface';
import Expandable from './Expandable';
import { colors } from '../theme';
import { defaultReaderSettings, readerFonts, readerThemes } from '../data/readerOptions';

export default function ReaderSettingsModal({ visible, value, onChange, onClose, error }) {
  const insets = useSafeAreaInsets();
  const [fontPicker, setFontPicker] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const settings = { ...defaultReaderSettings, ...value };
  const change = patch => onChange({ ...settings, ...patch });
  const dismiss = () => { setFontPicker(false); setAdvanced(false); onClose(); };
  const close = () => fontPicker ? setFontPicker(false) : dismiss();
  const fontName = readerFonts.find(font => font.value === settings.font)?.label || 'Roboto';
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть настройки чтения" onPress={close} style={StyleSheet.absoluteFill} />
      <MotionSurface testID="reader-settings-panel" visible={visible} style={[styles.panel, { paddingBottom: Math.max(10, insets.bottom) }]}>
        {fontPicker ? <>
          <View style={styles.fontHeading}><Text accessibilityRole="header" style={styles.title}>Шрифт</Text><Pressable accessibilityRole="button" accessibilityLabel="Назад к настройкам чтения" onPress={() => setFontPicker(false)} style={styles.iconButton}><Icon name="close" color={colors.accent} /></Pressable></View>
          {readerFonts.map(font => <Pressable key={font.value} accessibilityRole="radio" accessibilityLabel={font.label} accessibilityState={{ checked: font.value === settings.font }} aria-checked={font.value === settings.font} onPress={() => { change({ font: font.value }); setFontPicker(false); }} style={styles.fontChoice}><View style={[styles.radio, font.value === settings.font && styles.selectedRadio]} /><Text style={styles.label}>{font.label}</Text></Pressable>)}
        </> : <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.brightnessRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Автоматическая яркость чтения" accessibilityState={{ selected: settings.autoBrightness }} onPress={() => change({ autoBrightness: !settings.autoBrightness, brightness: 85 })} style={[styles.autoButton, settings.autoBrightness && styles.selected]}><Icon name="sun" color={colors.accent} size={26} /><Text style={styles.autoText}>Auto</Text></Pressable>
            <Slider value={settings.brightness} onChange={brightness => change({ brightness, autoBrightness: false })} label="Яркость чтения" testID="reader-brightness" />
          </View>
          <View style={styles.switchRow}><Text style={styles.label}>Регулировать яркость жестами</Text><Switch accessibilityLabel="Регулировать яркость жестами" value={settings.brightnessGestures} onValueChange={brightnessGestures => change({ brightnessGestures })} trackColor={{ true: '#9fc3dc', false: '#d1d4d6' }} thumbColor="#ffffff" /></View>
          <View style={styles.themes}>{readerThemes.map(theme => <Pressable key={theme.value} accessibilityRole="radio" accessibilityLabel={theme.label} accessibilityState={{ checked: settings.theme === theme.value }} aria-checked={settings.theme === theme.value} onPress={() => change({ theme: theme.value })} style={[styles.swatch, { backgroundColor: theme.paper }, settings.theme === theme.value && styles.selectedSwatch]}>{settings.theme === theme.value && <Text style={{ color: theme.ink, fontSize: 24 }}>A</Text>}</Pressable>)}</View>
          <View style={styles.fontRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Выбрать шрифт" onPress={() => setFontPicker(true)} style={styles.fontSelect}><Text style={styles.fontName}>{fontName}</Text><Icon name="down" size={15} color="#98a1a9" /></Pressable>
            <View style={styles.segment}>
              <Pressable accessibilityRole="button" accessibilityLabel="Уменьшить шрифт" disabled={settings.fontSize <= 14} onPress={() => change({ fontSize: Math.max(14, settings.fontSize - 2) })} style={[styles.half, styles.segmentDivider]}><Text style={[styles.accent, { fontSize: 16 }]}>A</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Увеличить шрифт" disabled={settings.fontSize >= 28} onPress={() => change({ fontSize: Math.min(28, settings.fontSize + 2) })} style={styles.half}><Text style={[styles.accent, { fontSize: 23 }]}>A</Text></Pressable>
            </View>
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.sizeHint}>Размер шрифта: {settings.fontSize}</Text>
          <View style={styles.modeRow}>
            <View style={[styles.segment, styles.flexSegment]}>{[['left', 'По левому краю', 'alignLeft'], ['justify', 'По ширине', 'alignJustify']].map(([alignment, label, icon]) => <Pressable key={alignment} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: settings.alignment === alignment }} aria-checked={settings.alignment === alignment} onPress={() => change({ alignment })} style={[styles.half, settings.alignment === alignment && styles.activeHalf]}><Icon name={icon} size={22} color={settings.alignment === alignment ? '#fff' : colors.accent} /></Pressable>)}</View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Дополнительные настройки чтения" accessibilityState={{ expanded: advanced }} aria-expanded={advanced} onPress={() => setAdvanced(!advanced)} style={styles.additional}><Text style={styles.link}>Дополнительные настройки</Text><Icon name={advanced ? 'up' : 'down'} size={17} color={colors.accent} /></Pressable>
          <Expandable expanded={advanced}>
            <Text style={styles.label}>Межстрочный интервал</Text><Slider label="Межстрочный интервал" minimum={1} maximum={2} step={0.1} value={settings.lineHeight} onChange={lineHeight => change({ lineHeight })} />
            <Text style={styles.label}>Поля страницы</Text><Slider label="Поля страницы" minimum={8} maximum={32} step={2} value={settings.horizontalPadding} onChange={horizontalPadding => change({ horizontalPadding })} />
            <Text style={styles.label}>Между абзацами</Text><Slider label="Между абзацами" minimum={0} maximum={24} step={2} value={settings.paragraphSpacing} onChange={paragraphSpacing => change({ paragraphSpacing })} />
          </Expandable>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" onPress={dismiss} style={styles.done}><Text style={styles.accent}>ГОТОВО</Text></Pressable>
        </ScrollView>}
      </MotionSurface>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' }, panel: { backgroundColor: '#ffffff', width: '100%', maxWidth: 480, maxHeight: '78%' }, content: { paddingTop: 6, paddingHorizontal: 16 },
  brightnessRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64 }, autoButton: { width: 42, height: 44, borderWidth: 1, borderColor: '#b1c7d9', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, autoText: { fontSize: 9, color: colors.accent }, selected: { backgroundColor: '#f0f3f7' },
  switchRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, label: { color: '#555653', fontSize: 14, flexShrink: 1 },
  themes: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#d0d0d0', paddingVertical: 20, marginHorizontal: -16, paddingHorizontal: 16 }, swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#c6c6c6', alignItems: 'center', justifyContent: 'center' }, selectedSwatch: { borderColor: colors.accent, borderWidth: 2 },
  fontRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 18 }, fontSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }, fontName: { color: '#555653', fontSize: 17 }, segment: { flexDirection: 'row', width: 130, minHeight: 42, borderWidth: 1, borderColor: '#b3c9db', borderRadius: 6, overflow: 'hidden', backgroundColor: '#f4f4f7' }, half: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center' }, segmentDivider: { borderRightWidth: 1, borderColor: '#b3c9db' }, activeHalf: { backgroundColor: colors.accent }, accent: { color: colors.accent, fontSize: 13 }, sizeHint: { color: '#939a9f', fontSize: 10, marginBottom: 8 },
  modeRow: { flexDirection: 'row', marginTop: 8 }, flexSegment: { flex: 1 }, additional: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 60, borderTopWidth: 1, borderColor: '#d0d0d0', marginTop: 20 }, link: { color: colors.accent, fontSize: 14, fontWeight: '500' }, done: { minHeight: 36, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 8 }, error: { color: '#b85f57', fontSize: 13 },
  fontHeading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }, title: { flex: 1, fontSize: 18, color: '#555653', fontWeight: '500' }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, fontChoice: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 14, paddingHorizontal: 20 }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.accent }, selectedRadio: { borderWidth: 5 },
});
