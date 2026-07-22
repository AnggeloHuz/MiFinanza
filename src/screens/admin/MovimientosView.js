import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

export default function MovimientosView({ isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={[styles.dummyCard, { backgroundColor: theme.cardBackground }]}>
        <FontAwesome5 name="hand-holding-usd" size={38} color={theme.accent} />
        <Text style={[styles.dummyTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Historial de Movimientos
        </Text>
        <Text style={[styles.dummySubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
          Registro en tiempo real de transferencias, depósitos y operaciones del sistema.
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
