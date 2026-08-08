import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/hooks/useColors';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function PermissionGate({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [canOpenSettings, setCanOpenSettings] = useState(false);

  const checkPermissions = async () => {
    setChecking(true);
    try {
      if (Platform.OS === 'web') {
        setAllowed(false);
        setCanOpenSettings(false);
        return;
      }

      const [locationPermission, contactsPermission] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Contacts.getPermissionsAsync(),
      ]);
      const hasAllPermissions =
        locationPermission.granted && contactsPermission.granted;
      setAllowed(hasAllPermissions);
      setCanOpenSettings(
        !locationPermission.canAskAgain || !contactsPermission.canAskAgain,
      );
    } catch {
      setAllowed(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkPermissions().catch(() => setChecking(false));
  }, []);

  const requestPermissions = async () => {
    setChecking(true);
    try {
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();
      if (!locationPermission.granted) {
        setCanOpenSettings(!locationPermission.canAskAgain);
        return;
      }

      const contactsPermission = await Contacts.requestPermissionsAsync();
      setAllowed(contactsPermission.granted);
      setCanOpenSettings(!contactsPermission.canAskAgain);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={[permissionStyles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (allowed) return <>{children}</>;

  return (
    <View
      style={[
        permissionStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={[permissionStyles.iconCircle, { backgroundColor: colors.secondary }]}>
        <Ionicons name="lock-closed-outline" size={30} color={colors.primary} />
      </View>
      <Text style={[permissionStyles.title, { color: colors.foreground }]}>
        يلزمنا لتحديد موقعك الصلاحيات التالية
      </Text>
      <Text style={[permissionStyles.permissions, { color: colors.primary }]}>
        الموقع الجغرافي{'\n'}جهات الاتصال
      </Text>
      <Pressable
        testID="request-required-permissions"
        onPress={requestPermissions}
        disabled={checking || Platform.OS === 'web'}
        style={({ pressed }) => [
          permissionStyles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Text style={[permissionStyles.buttonText, { color: colors.primaryForeground }]}>
          السماح بالصلاحيات
        </Text>
      </Pressable>
      {canOpenSettings && Platform.OS !== 'web' && (
        <Pressable
          testID="open-permission-settings"
          onPress={() => Linking.openSettings().catch(() => undefined)}
          style={permissionStyles.settingsButton}
        >
          <Text style={[permissionStyles.settingsText, { color: colors.mutedForeground }]}>
            فتح إعدادات التطبيق
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <PermissionGate>
                <RootLayoutNav />
              </PermissionGate>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const permissionStyles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 33,
  },
  permissions: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 17,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  settingsButton: { padding: 14, marginTop: 4 },
  settingsText: { fontSize: 13, fontWeight: '600' },
});
