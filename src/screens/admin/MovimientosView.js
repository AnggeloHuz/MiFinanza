import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import MovimientoFormView from './MovimientoFormView';
import MovimientoDetailView from './MovimientoDetailView';

export default function MovimientosView({ isDark, tiposMovimientoList, onRefresh }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedTipo, setSelectedTipo] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado en tiempo real
  const filteredTipos = useMemo(() => {
    if (!searchQuery.trim()) return tiposMovimientoList;
    const lowerQuery = searchQuery.toLowerCase();
    return tiposMovimientoList.filter(
      (t) =>
        t.nombre.toLowerCase().includes(lowerQuery) ||
        t.tipo.toLowerCase().includes(lowerQuery) ||
        t.id.toString().includes(lowerQuery)
    );
  }, [searchQuery, tiposMovimientoList]);

  // Si se seleccionó un tipo → mostrar detalle (Stack)
  if (selectedTipo) {
    return (
      <MovimientoDetailView
        tipoMovimiento={selectedTipo}
        isDark={isDark}
        onBack={() => setSelectedTipo(null)}
        onRefresh={onRefresh}
      />
    );
  }

  // Si se presionó "Agregar" → mostrar formulario
  if (showAddForm) {
    return (
      <MovimientoFormView
        isDark={isDark}
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
          placeholder="Buscar por nombre o tipo..."
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
          <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            Tipos de Movimiento
          </Text>
          <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.countBadgeText}>{filteredTipos.length}</Text>
          </View>
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
            Agregar Nuevo Tipo de Movimiento
          </Text>
        </TouchableOpacity>

        {/* Lista de tipos de movimiento */}
        {filteredTipos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-vertical-outline" size={42} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
              {searchQuery ? 'No se encontraron tipos de movimiento.' : 'No hay tipos de movimiento registrados aún.'}
            </Text>
          </View>
        ) : (
          filteredTipos.map((item) => {
            const isIngreso = item.tipo === 'Ingreso';
            const tipoColor = isIngreso ? '#10B981' : '#EF4444';
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedTipo(item)}
                key={item.id.toString()}
                style={[
                  styles.tipoCard,
                  {
                    backgroundColor: theme.cardBackground,
                    shadowColor: theme.cardShadow,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                ]}
              >
                <View style={[styles.tipoAvatar, { backgroundColor: tipoColor }]}>
                  <Ionicons
                    name={isIngreso ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={24}
                    color="#FFF"
                  />
                </View>

                <View style={styles.tipoInfo}>
                  <Text style={[styles.tipoNameText, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.tipoSubText, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
                    ID #{item.id}
                  </Text>
                </View>

                <View
                  style={[
                    styles.tipoBadge,
                    {
                      backgroundColor: tipoColor + '20',
                      borderColor: tipoColor,
                    },
                  ]}
                >
                  <Text style={[styles.tipoBadgeText, { color: tipoColor, fontFamily: Fonts.medium }]}>
                    {item.tipo}
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
  tipoCard: {
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
  tipoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tipoInfo: {
    flex: 1,
  },
  tipoNameText: {
    fontSize: 16,
    marginBottom: 2,
  },
  tipoSubText: {
    fontSize: 12,
  },
  tipoBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tipoBadgeText: {
    fontSize: 12,
  },
});
