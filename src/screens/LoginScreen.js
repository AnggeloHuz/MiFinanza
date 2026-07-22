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
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

// Assets
const logoClaro = require('../../assets/logo-claro.png');
const logoOscuro = require('../../assets/logo-oscuro.png');

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { login, loginWithBiometric, isAuthenticating } = useAuth();

  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const loginBtnScale = useRef(new Animated.Value(1)).current;
  const bioBtnScale = useRef(new Animated.Value(1)).current;

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

  const handleLogin = async () => {
    if (isAuthenticating) return;
    await login(username, password);
  };

  const handleBiometric = async () => {
    if (isAuthenticating) return;
    await loginWithBiometric();
  };

  const handleForgotPassword = () => {
    // TODO: Navegar a pantalla de restablecimiento
    console.log('Forgot password');
  };

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
            Iniciar Sesión
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
                  {
                    color: theme.textPrimary,
                    fontFamily: Fonts.medium,
                  },
                ]}
              >
                Usuario
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: usernameFocused
                      ? theme.inputBorderFocused
                      : theme.inputBorder,
                    borderWidth: usernameFocused ? 1.5 : 1,
                    shadowColor: usernameFocused
                      ? theme.inputBorderFocused
                      : 'transparent',
                    shadowOpacity: usernameFocused ? 0.25 : 0,
                    shadowRadius: usernameFocused ? 8 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: usernameFocused ? 3 : 0,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.textPrimary,
                      fontFamily: Fonts.regular,
                    },
                  ]}
                  placeholder="Nombre de usuario..."
                  placeholderTextColor={theme.placeholder}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAuthenticating}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.textPrimary,
                    fontFamily: Fonts.medium,
                  },
                ]}
              >
                Contraseña
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: passwordFocused
                      ? theme.inputBorderFocused
                      : theme.inputBorder,
                    borderWidth: passwordFocused ? 1.5 : 1,
                    shadowColor: passwordFocused
                      ? theme.inputBorderFocused
                      : 'transparent',
                    shadowOpacity: passwordFocused ? 0.25 : 0,
                    shadowRadius: passwordFocused ? 8 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: passwordFocused ? 3 : 0,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      color: theme.textPrimary,
                      fontFamily: Fonts.regular,
                    },
                  ]}
                  placeholder="••••••••••"
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAuthenticating}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Text
                    style={[
                      styles.eyeIcon,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Animated.View
              style={{ transform: [{ scale: loginBtnScale }] }}
            >
              <Pressable
                onPressIn={() => handlePressIn(loginBtnScale)}
                onPressOut={() => handlePressOut(loginBtnScale)}
                onPress={handleLogin}
                disabled={isAuthenticating}
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: theme.accent,
                    opacity: isAuthenticating ? 0.7 : 1,
                  },
                ]}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.loginButtonText,
                        { fontFamily: Fonts.bold },
                      ]}
                    >
                      Iniciar Sesión
                    </Text>
                    <Text style={styles.loginButtonIcon}>➤</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>

            {/* Biometric Button */}
            <Animated.View
              style={{ transform: [{ scale: bioBtnScale }] }}
            >
              <Pressable
                onPressIn={() => handlePressIn(bioBtnScale)}
                onPressOut={() => handlePressOut(bioBtnScale)}
                onPress={handleBiometric}
                disabled={isAuthenticating}
                style={[
                  styles.bioButton,
                  {
                    backgroundColor: theme.bioBtnBackground,
                    borderColor: isDark
                      ? 'rgba(26, 171, 138, 0.3)'
                      : 'transparent',
                    borderWidth: isDark ? 1 : 0,
                    opacity: isAuthenticating ? 0.7 : 1,
                  },
                ]}
              >
                {isAuthenticating ? (
                  <ActivityIndicator
                    color={theme.bioBtnText}
                    size="small"
                  />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.bioButtonText,
                        {
                          color: theme.bioBtnText,
                          fontFamily: Fonts.medium,
                        },
                      ]}
                    >
                      Biométrica
                    </Text>
                    <Text style={styles.bioButtonIcon}>🔐</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>

            {/* Forgot Password Link */}
            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotContainer}
              disabled={isAuthenticating}
            >
              <Text
                style={[
                  styles.forgotText,
                  {
                    color: theme.linkColor,
                    fontFamily: Fonts.medium,
                  },
                ]}
              >
                Restablecer Contraseña
              </Text>
            </Pressable>
          </Animated.View>
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
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 28,
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.md + 4,
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    minHeight: 50,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loginButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm + 4,
    minHeight: 50,
  },
  bioButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  bioButtonIcon: {
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  forgotContainer: {
    alignItems: 'center',
    marginTop: Spacing.md + 4,
    paddingVertical: Spacing.sm,
  },
  forgotText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
});
