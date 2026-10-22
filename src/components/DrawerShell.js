import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { layout } from '../theme';

export default function DrawerShell({ visible, onClose, side = 'left', children, onShow = () => {}, overlayContent = null }) {
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} onShow={onShow}>
    <View style={styles.overlay}>
      {overlayContent ? <View style={styles.fullOverlay}>{overlayContent}</View> : <>
      <Pressable accessibilityRole="button" accessibilityLabel={side === 'left' ? 'Закрыть меню' : 'Закрыть меню пользователя'} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View pointerEvents="box-none" style={styles.frame}>
        <SafeAreaView testID={`${side}-drawer`} style={[styles.drawer, side === 'right' && styles.right]}>{children}</SafeAreaView>
      </View>
      </>}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)' },
  frame: { flex: 1, width: '100%', maxWidth: layout.maxWidth },
  drawer: { flex: 1, width: '71.4%', backgroundColor: '#1e1f22' },
  right: { alignSelf: 'flex-end' },
  fullOverlay: { flex: 1, width: '100%' },
});
