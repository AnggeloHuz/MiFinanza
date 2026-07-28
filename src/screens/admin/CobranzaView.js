import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

export default function CobranzaView({ isDark, userId, onBackMenu }) {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackMenu} style={{ marginRight: 10, padding: 5 }}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Gestión de Cobranza
        </Text>
      </View>
      <View style={styles.placeholderContainer}>
        <Ionicons name="construct-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.placeholderText, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
          El módulo de cobranza estará disponible próximamente.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
