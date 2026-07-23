import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainScreen from './src/screens/MainScreen';
import { Colors } from './src/constants/theme';

// Mantener la splash screen visible mientras se cargan las fuentes
SplashScreen.preventAutoHideAsync();

/**
 * Componente navegador que renderiza Login, Register o MainScreen según estado de autenticación.
 */
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('login');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Mostrar loading mientras se inicializa la BD y verifica sesión
  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Si está autenticado, todos van a MainScreen
  if (isAuthenticated) {
    return <MainScreen />;
  }

  // Navegación entre Login y Register
  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onNavigateLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateRegister={() => setCurrentScreen('register')}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
