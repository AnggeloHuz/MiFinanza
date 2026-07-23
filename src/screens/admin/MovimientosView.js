import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import TiposMovimientoView from './TiposMovimientoView';
import HistorialMovimientosView from './HistorialMovimientosView';

export default function MovimientosView({ isDark, tiposMovimientoList, onRefresh, userId, initialView, initialFilter }) {
  const theme = isDark ? Colors.dark : Colors.light;
  
  // 'menu' | 'tipos' | 'historial'
  const [currentView, setCurrentView] = useState(initialView || 'menu');

  // React to initialView changes if the tab is re-selected with new params
  React.useEffect(() => {
    if (initialView) setCurrentView(initialView);
  }, [initialView]);

  if (currentView === 'tipos') {
    return (
      <TiposMovimientoView 
        isDark={isDark} 
        tiposMovimientoList={tiposMovimientoList} 
        onRefresh={onRefresh} 
        userId={userId} 
        onBackMenu={() => setCurrentView('menu')}
      />
    );
  }

  if (currentView === 'historial') {
    return (
      <HistorialMovimientosView 
        isDark={isDark} 
        userId={userId} 
        onBackMenu={() => setCurrentView('menu')}
        initialFilter={initialFilter}
      />
    );
  }

  // MENÚ PRINCIPAL DE MOVIMIENTOS
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <Text style={[styles.menuTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Gestión de Movimientos
        </Text>
        <Text style={[styles.menuSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
          Seleccione una opción para continuar
        </Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}
          onPress={() => setCurrentView('tipos')}
        >
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(26, 171, 138, 0.15)' : 'rgba(26, 171, 138, 0.1)' }]}>
            <Ionicons name="list-outline" size={28} color={theme.accent} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Tipos de Movimiento
            </Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Cree o edite categorías como ingresos, egresos, salarios, compras, etc.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}
          onPress={() => setCurrentView('historial')}
        >
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
            <FontAwesome5 name="exchange-alt" size={24} color="#3B82F6" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Movimientos
            </Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Registre, vea y gestione sus transacciones e intercambios reales.
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
