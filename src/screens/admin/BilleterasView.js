import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

export default function BilleterasView({ isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={[styles.dummyCard, { backgroundColor: theme.cardBackground }]}>
        <Ionicons name="wallet-outline" size={42} color={theme.accent} />
        <Text style={[styles.dummyTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Módulo de Billeteras
        </Text>
        <Text style={[styles.dummySubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
          Gestión de cuentas principales, fondos de reserva y monedas globales de MiFinanza.
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
  dummyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  dummyTitle: {
    fontSize: 18,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  dummySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
