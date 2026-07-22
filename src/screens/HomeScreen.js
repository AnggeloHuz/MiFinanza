import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useColorScheme,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

// Assets
const logoClaro = require('../../assets/logo-claro.png');
const logoOscuro = require('../../assets/logo-oscuro.png');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, logout } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoutBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(logoutBtnScale, {
      toValue: 0.96,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(logoutBtnScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const getRolLabel = (rol) => {
    const roles = {
      administrador: '🛡️ Administrador',
      usuario: '👤 Usuario',
    };
    return roles[rol] || `👤 ${rol}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={isDark ? logoOscuro : logoClaro}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          <Text
            style={[
              styles.welcomeLabel,
              {
                color: theme.textSecondary,
                fontFamily: Fonts.medium,
              },
            ]}
          >
            ¡Bienvenido!
          </Text>

          <Text
            style={[
              styles.userName,
              {
                color: theme.textPrimary,
                fontFamily: Fonts.bold,
              },
            ]}
          >
            {user?.usuario || 'Usuario'}
          </Text>

          {/* Rol Badge */}
          <View
            style={[
              styles.rolBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(26, 171, 138, 0.15)'
                  : 'rgba(26, 171, 138, 0.12)',
                borderColor: theme.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.rolText,
                {
                  color: theme.accent,
                  fontFamily: Fonts.medium,
                },
              ]}
            >
              {getRolLabel(user?.rol)}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          />

          {/* Session Info */}
          <Text
            style={[
              styles.sessionInfo,
              {
                color: theme.textSecondary,
                fontFamily: Fonts.regular,
              },
            ]}
          >
            Sesión iniciada correctamente.{'\n'}
            Tu panel de MiFinanza está listo.
          </Text>
        </View>

        {/* Logout Button */}
        <Animated.View
          style={[
            styles.logoutWrapper,
            { transform: [{ scale: logoutBtnScale }] },
          ]}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={logout}
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDark ? '#2A1520' : '#FDE8E8',
                borderColor: isDark ? '#8B3A3A' : '#E53E3E',
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.logoutText,
                {
                  color: isDark ? '#F56565' : '#C53030',
                  fontFamily: Fonts.bold,
                },
              ]}
            >
              Cerrar Sesión
            </Text>
            <Text style={styles.logoutIcon}>🚪</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  welcomeLabel: {
    fontSize: 16,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: 32,
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  rolBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  rolText: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  divider: {
    width: '80%',
    height: 1,
    marginBottom: Spacing.md,
  },
  sessionInfo: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  logoutWrapper: {
    width: '100%',
    maxWidth: 400,
    marginTop: Spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.sm,
  },
  logoutText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  logoutIcon: {
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
});
