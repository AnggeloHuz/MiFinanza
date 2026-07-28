import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import CreditosView from './CreditosView';
import CobranzasView from './CobranzasView';

export default function CreditoCobranzaView({ isDark, userId }) {
  const theme = isDark ? Colors.dark : Colors.light;

  // 'menu' | 'creditos' | 'cobranza'
  const [currentView, setCurrentView] = useState('menu');

  if (currentView === 'creditos') {
    return (
      <CreditosView 
        isDark={isDark} 
        userId={userId} 
        onBackMenu={() => setCurrentView('menu')}
      />
    );
  }

  if (currentView === 'cobranza') {
    return (
      <CobranzasView 
        isDark={isDark} 
        userId={userId} 
        onBackMenu={() => setCurrentView('menu')}
      />
    );
  }

  // MENÚ PRINCIPAL
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <Text style={[styles.menuTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Crédito y Cobranza
        </Text>
        <Text style={[styles.menuSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
          Seleccione una opción para continuar
        </Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}
          onPress={() => setCurrentView('creditos')}
        >
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="card-outline" size={28} color="#EF4444" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Créditos (Cuentas por Pagar)
            </Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Gestione los créditos y préstamos que usted debe a otras personas o entidades.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}
          onPress={() => setCurrentView('cobranza')}
        >
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="people-outline" size={28} color="#10B981" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Cobranza (Cuentas por Cobrar)
            </Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Gestione el dinero que otras personas le deben y haga seguimiento a los pagos.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  menuTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
});
