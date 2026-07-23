import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

export default function DashboardView({ isDark, user }) {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={[styles.welcomeCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="grid-outline" size={42} color={theme.accent} />
        <Text style={[styles.welcomeTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Dashboard
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
          Bienvenido, {user?.usuario || 'Usuario'}. Tu panel principal será configurado próximamente.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  welcomeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
