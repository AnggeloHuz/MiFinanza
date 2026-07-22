/**
 * MiFinanza - Auth Context
 * Maneja el estado global de autenticación: login, logout, biométrica.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { initDatabase, validateUser, getUserByUsername } from '../database/database';

const SECURE_STORE_KEY = 'mifinanza_last_user';

const AuthContext = createContext(null);

/**
 * Hook para acceder al contexto de autenticación.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

/**
 * Provider de autenticación. Envuelve toda la app.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isAuthenticated = !!user;

  // Inicializar BD y verificar sesión previa al montar
  useEffect(() => {
    async function bootstrap() {
      try {
        // Inicializar la base de datos (crea tablas + usuario semilla)
        await initDatabase();

        // Verificar si hay una sesión guardada en SecureStore
        const storedUser = await SecureStore.getItemAsync(SECURE_STORE_KEY);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // Verificar que el usuario aún exista en la BD
          const dbUser = await getUserByUsername(parsed.usuario);
          if (dbUser) {
            setUser(dbUser);
          } else {
            // Usuario ya no existe, limpiar sesión
            await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
          }
        }
      } catch (error) {
        console.error('[Auth] Error en bootstrap:', error);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  /**
   * Login con usuario y contraseña.
   * Valida contra SQLite y guarda sesión en SecureStore.
   */
  async function login(usuario, contrasena) {
    if (!usuario.trim() || !contrasena.trim()) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tu usuario y contraseña.');
      return false;
    }

    setIsAuthenticating(true);
    try {
      const validUser = await validateUser(usuario.trim(), contrasena);

      if (!validUser) {
        Alert.alert(
          'Credenciales inválidas',
          'El usuario o la contraseña son incorrectos.'
        );
        return false;
      }

      // Guardar sesión en SecureStore para biométrica futura
      await SecureStore.setItemAsync(
        SECURE_STORE_KEY,
        JSON.stringify({ usuario: validUser.usuario, rol: validUser.rol })
      );

      setUser(validUser);
      return true;
    } catch (error) {
      console.error('[Auth] Error en login:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión. Intenta de nuevo.');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  /**
   * Login con autenticación biométrica.
   * Requiere sesión previa guardada en SecureStore.
   */
  async function loginWithBiometric() {
    setIsAuthenticating(true);
    try {
      // 1. Verificar hardware biométrico disponible
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(
          'No disponible',
          'Tu dispositivo no tiene soporte para autenticación biométrica.'
        );
        return false;
      }

      // 2. Verificar si hay biométricos registrados
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(
          'Sin biométricos',
          'No tienes datos biométricos registrados en tu dispositivo. Configúralos en los ajustes del sistema.'
        );
        return false;
      }

      // 3. Verificar que haya una sesión previa guardada
      const storedUser = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!storedUser) {
        Alert.alert(
          'Sesión requerida',
          'Debes iniciar sesión con usuario y contraseña al menos una vez antes de usar la autenticación biométrica.'
        );
        return false;
      }

      // 4. Autenticar con biométrica
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación biométrica',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar contraseña del dispositivo',
      });

      if (!result.success) {
        if (result.error !== 'user_cancel') {
          Alert.alert(
            'Autenticación fallida',
            'No se pudo verificar tu identidad biométrica.'
          );
        }
        return false;
      }

      // 5. Recuperar usuario de SecureStore y validar en BD
      const parsed = JSON.parse(storedUser);
      const dbUser = await getUserByUsername(parsed.usuario);

      if (!dbUser) {
        Alert.alert(
          'Usuario no encontrado',
          'El usuario asociado a la biométrica ya no existe. Inicia sesión con credenciales.'
        );
        await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
        return false;
      }

      setUser(dbUser);
      return true;
    } catch (error) {
      console.error('[Auth] Error en loginWithBiometric:', error);
      Alert.alert('Error', 'Ocurrió un error con la autenticación biométrica.');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  /**
   * Cierra sesión del usuario actual.
   * NO borra la sesión de SecureStore para permitir biométrica futura.
   */
  async function logout() {
    setUser(null);
    // Nota: No borramos SecureStore para que la biométrica siga funcionando
    console.log('[Auth] Sesión cerrada');
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isAuthenticating,
    login,
    loginWithBiometric,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
