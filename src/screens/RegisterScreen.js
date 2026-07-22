import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUser } from '../database/database';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

// Assets
const logoClaro = require('../../assets/logo-claro.png');
const logoOscuro = require('../../assets/logo-oscuro.png');

export default function RegisterScreen({ onNavigateLogin }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const registerBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardAnim, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(cardSlide, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = (scaleRef) => {
    Animated.spring(scaleRef, {
      toValue: 0.96,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (scaleRef) => {
    Animated.spring(scaleRef, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleRegister = async () => {
    if (isRegistering) return;

    // Validaciones
    if (!username.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un nombre de usuario.');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Usuario inválido', 'El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa una contraseña.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setIsRegistering(true);
    try {
      const result = await createUser(username.trim(), password);

      if (result.success) {
        Alert.alert(
          '¡Registro exitoso!',
          'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
          [
            {
              text: 'Iniciar Sesión',
              onPress: () => onNavigateLogin(),
            },
          ]
        );
      } else {
        Alert.alert('Error de registro', result.message);
      }
    } catch (error) {
      console.error('[Register] Error:', error);
      Alert.alert('Error', 'Ocurrió un error al registrar. Intenta de nuevo.');
    } finally {
      setIsRegistering(false);
    }
  };

  const getInputStyle = (isFocused) => ({
    backgroundColor: theme.inputBackground,
    borderColor: isFocused ? theme.inputBorderFocused : theme.inputBorder,
    borderWidth: isFocused ? 1.5 : 1,
    shadowColor: isFocused ? theme.inputBorderFocused : 'transparent',
    shadowOpacity: isFocused ? 0.25 : 0,
    shadowRadius: isFocused ? 8 : 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: isFocused ? 3 : 0,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoAnim,
                transform: [
                  {
                    scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={isDark ? logoOscuro : logoClaro}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Title */}
          <Animated.Text
            style={[
              styles.title,
              {
                color: theme.textPrimary,
                fontFamily: Fonts.bold,
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Crear Cuenta
          </Animated.Text>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.cardShadow,
                opacity: cardAnim,
                transform: [{ translateY: cardSlide }],
              },
            ]}
          >
            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.label,
                  { color: theme.textPrimary, fontFamily: Fonts.medium },
                ]}
              >
                Usuario
              </Text>
              <View style={[styles.inputWrapper, getInputStyle(usernameFocused)]}>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.textPrimary, fontFamily: Fonts.regular },
                  ]}
                  placeholder="Nombre de usuario..."
                  placeholderTextColor={theme.placeholder}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isRegistering}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.label,
                  { color: theme.textPrimary, fontFamily: Fonts.medium },
                ]}
              >
                Contraseña
              </Text>
              <View style={[styles.inputWrapper, getInputStyle(passwordFocused)]}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { color: theme.textPrimary, fontFamily: Fonts.regular },
                  ]}
                  placeholder="Mínimo 6 caracteres..."
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isRegistering}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Text style={[styles.eyeIcon, { color: theme.textSecondary }]}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.label,
                  { color: theme.textPrimary, fontFamily: Fonts.medium },
                ]}
              >
                Confirmar Contraseña
              </Text>
              <View style={[styles.inputWrapper, getInputStyle(confirmFocused)]}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { color: theme.textPrimary, fontFamily: Fonts.regular },
                  ]}
                  placeholder="Repite tu contraseña..."
                  placeholderTextColor={theme.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isRegistering}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Text style={[styles.eyeIcon, { color: theme.textSecondary }]}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Rol Info */}
            <View
              style={[
                styles.rolInfo,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 171, 138, 0.1)'
                    : 'rgba(26, 171, 138, 0.08)',
                  borderColor: isDark
                    ? 'rgba(26, 171, 138, 0.25)'
                    : 'rgba(26, 171, 138, 0.2)',
                },
              ]}
            >
              <Text
                style={[
                  styles.rolInfoText,
                  { color: theme.accent, fontFamily: Fonts.regular },
                ]}
              >
                👤 Se te asignará el rol de Usuario
              </Text>
            </View>

            {/* Register Button */}
            <Animated.View
              style={{ transform: [{ scale: registerBtnScale }] }}
            >
              <Pressable
                onPressIn={() => handlePressIn(registerBtnScale)}
                onPressOut={() => handlePressOut(registerBtnScale)}
                onPress={handleRegister}
                disabled={isRegistering}
                style={[
                  styles.registerButton,
                  {
                    backgroundColor: theme.accent,
                    opacity: isRegistering ? 0.7 : 1,
                  },
                ]}
              >
                {isRegistering ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.registerButtonText,
                        { fontFamily: Fonts.bold },
                      ]}
                    >
                      Registrarse
                    </Text>
                    <Text style={styles.registerButtonIcon}>✓</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>

            {/* Back to Login Link */}
            <Pressable
              onPress={onNavigateLogin}
              style={styles.linkContainer}
              disabled={isRegistering}
            >
              <Text
                style={[
                  styles.linkText,
                  { color: theme.textSecondary, fontFamily: Fonts.regular },
                ]}
              >
                ¿Ya tienes cuenta?{' '}
              </Text>
              <Text
                style={[
                  styles.linkTextBold,
                  { color: theme.linkColor, fontFamily: Fonts.bold },
                ]}
              >
                Iniciar Sesión
              </Text>
            </Pressable>
          </Animated.View>

          {/* Copyright */}
          <Text
            style={[
              styles.copyright,
              { color: theme.textSecondary, fontFamily: Fonts.regular },
            ]}
          >
            © 2026 MiFinanza. Todos los derechos reservados.{'\n'}
            Propiedad del Ing. Anggelo Huz.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    fontSize: 28,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 15,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  rolInfo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  rolInfoText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    minHeight: 50,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  registerButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: Spacing.sm,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md + 4,
    paddingVertical: Spacing.sm,
  },
  linkText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  linkTextBold: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  copyright: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
    letterSpacing: 0.1,
    opacity: 0.7,
  },
});
