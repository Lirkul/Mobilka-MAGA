import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular';
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStorage } from '../services/appState';

configureStorage(AsyncStorage);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });

  if (!fontsLoaded && !fontError) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack id="root" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
