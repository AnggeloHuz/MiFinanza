import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import BilleteraFormView from './BilleteraFormView';
import BilleteraDetailView from './BilleteraDetailView';
import { formatCurrencyVE } from '../../utils/currencyFormatter';

// Colores por moneda para el avatar de la tarjeta
const MONEDA_COLORS = {
  VES: '#3B82F6',
  USD: '#10B981',
  EUR: '#8B5CF6',
};

export default function BilleterasView({ isDark, billeterasList, onRefresh, userId, onGoToHistory }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedBilletera, setSelectedBilletera] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado en tiempo real
  const filteredBilleteras = useMemo(() => {
    if (!searchQuery.trim()) return billeterasList;
    const lowerQuery = searchQuery.toLowerCase();
    return billeterasList.filter(
      (b) =>
        b.nombre.toLowerCase().includes(lowerQuery) ||
        b.moneda_abreviatura.toLowerCase().includes(lowerQuery) ||
        b.codigo.toLowerCase().includes(lowerQuery) ||
        b.id.toString().includes(lowerQuery)
    );
  }, [searchQuery, billeterasList]);

  // Si se seleccionó una billetera → mostrar detalle (Stack)
  if (selectedBilletera) {
    return (
      <BilleteraDetailView
        billetera={selectedBilletera}
        isDark={isDark}
        userId={userId}
        onBack={() => setSelectedBilletera(null)}
        onRefresh={onRefresh}
        onGoToHistory={() => onGoToHistory && onGoToHistory(selectedBilletera.nombre)}
      />
    );
  }

  // Si se presionó "Agregar" → mostrar formulario
  if (showAddForm) {
    return (
      <BilleteraFormView
        isDark={isDark}
        userId={userId}
        onBack={() => setShowAddForm(false)}
        onSaved={onRefresh}
      />
    );
  }

  // VISTA DE LISTA
  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Buscar por nombre, moneda o código..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        {/* Header de sección */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Billeteras Registradas
            </Text>
            <View style={[styles.countBadge, { backgroundColor: theme.accent, marginLeft: Spacing.sm }]}>
              <Text style={styles.countBadgeText}>{filteredBilleteras.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} style={{ padding: Spacing.xs }}>
            <Ionicons name="refresh" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Botón Agregar */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowAddForm(true)}
          style={[
            styles.addBtn,
            {
              backgroundColor: isDark ? 'rgba(26, 171, 138, 0.15)' : 'rgba(26, 171, 138, 0.1)',
              borderColor: theme.accent,
            },
          ]}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
          <Text style={[styles.addBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            Agregar Nueva Billetera
          </Text>
        </TouchableOpacity>

        {/* Lista de billeteras */}
        {filteredBilleteras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={42} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
              {searchQuery ? 'No se encontraron billeteras.' : 'No hay billeteras registradas aún.'}
            </Text>
          </View>
        ) : (
          filteredBilleteras.map((item) => {
            const avatarColor = MONEDA_COLORS[item.moneda_abreviatura] || theme.accent;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedBilletera(item)}
                key={item.id.toString()}
                style={[
                  styles.billeteraCard,
                  {
                    backgroundColor: theme.cardBackground,
                    shadowColor: theme.cardShadow,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                ]}
              >
                <View style={[styles.billeteraAvatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.billeteraAvatarText}>{item.moneda_abreviatura}</Text>
                </View>

                <View style={styles.billeteraInfo}>
                  <Text style={[styles.billeteraNameText, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.billeteraSubText, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
                    {item.codigo !== 'Sin código' ? `Código: ${item.codigo}` : 'Sin código bancario'}
                  </Text>
                  <Text style={[styles.billeteraSubText, { color: theme.textPrimary, fontFamily: Fonts.medium, marginTop: 4 }]}>
                    Balance: {formatCurrencyVE(item.balance)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.monedaBadge,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      borderColor: theme.inputBorder,
                    },
                  ]}
                >
                  <Text style={[styles.monedaBadgeText, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
                    {item.moneda_abreviatura}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  addBtnText: {
    fontSize: 15,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  billeteraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  billeteraAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  billeteraAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  billeteraInfo: {
    flex: 1,
  },
  billeteraNameText: {
    fontSize: 16,
    marginBottom: 2,
  },
  billeteraSubText: {
    fontSize: 12,
  },
  monedaBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  monedaBadgeText: {
    fontSize: 12,
  },
});
