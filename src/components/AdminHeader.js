import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, StatusBar as StatusBarNative } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

const logoClaro = require('../../assets/logo-claro.png');
const logoOscuro = require('../../assets/logo-oscuro.png');

const statusBarHeight = Platform.OS === 'android' ? (StatusBarNative.currentHeight || 24) : 44;

export default function AdminHeader({ title, onBackPress, isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ backgroundColor: theme.background }}>
      {/* HEADER SUPERIOR IGUAL A LA IMAGEN DE REFERENCIA */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.cardShadow,
          },
        ]}
      >
        {/*<Pressable
          onPress={onBackPress}
          style={styles.backButton}
          hitSlop={12}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.textPrimary}
          />
        </Pressable> */}

        <View style={styles.headerRight}>
          <Text
            style={[
              styles.headerTitleText,
              { color: theme.textPrimary, fontFamily: Fonts.bold },
            ]}
          >
            {title}
          </Text>
          <Image
            source={isDark ? logoOscuro : logoClaro}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: statusBarHeight + 10,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    marginRight: Spacing.sm,
    letterSpacing: 0.2,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  sectionHeaderContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    alignItems: 'flex-start',
  },
  sectionTitleBox: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md + 4,
    borderRadius: BorderRadius.xs || 4,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    minWidth: 130,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitleText: {
    fontSize: 18,
    letterSpacing: 0.3,
  },
  greenBottomLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },
});
