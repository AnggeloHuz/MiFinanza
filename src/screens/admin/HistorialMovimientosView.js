import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getAllMovimientos } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import MovimientoRealFormView from './MovimientoRealFormView';
import MovimientoRealDetailView from './MovimientoRealDetailView';

export default function HistorialMovimientosView({ isDark, userId, onBackMenu, initialFilter }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [movimientos, setMovimientos] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);

  // Filtros
  const [filterTipo, setFilterTipo] = useState('Todos'); // 'Todos' | 'Ingreso' | 'Egreso'
  const [searchQuery, setSearchQuery] = useState(initialFilter || '');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Reaccionar a cambios en initialFilter si se navega desde billeteras
  useEffect(() => {
    if (initialFilter !== undefined) {
      setSearchQuery(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchMovimientos();
  }, [userId]);

  const fetchMovimientos = async () => {
    try {
      const data = await getAllMovimientos(userId);
      setMovimientos(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDateInput = (text, setter) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    if (cleaned.length > 4) formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
    setter(formatted);
  };

  const parseVisualDate = (vd) => {
    if (vd.length !== 10) return null;
    const parts = vd.split('/');
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  };

  const filteredMovimientos = useMemo(() => {
    let result = movimientos;

    // Filtro por tipo
    if (filterTipo !== 'Todos') {
      result = result.filter(m => m.categoria === filterTipo);
    }

    // Filtro por búsqueda (nombre del tipo)
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.tipo_nombre.toLowerCase().includes(lowerQuery) ||
        m.billetera_nombre.toLowerCase().includes(lowerQuery)
      );
    }

    // Filtro por rango de fechas
    const dInicio = parseVisualDate(fechaInicio);
    const dFin = parseVisualDate(fechaFin);

    if (dInicio || dFin) {
      result = result.filter(m => {
        const movDate = new Date(`${m.fecha}T00:00:00`);
        let valid = true;
        if (dInicio && movDate < dInicio) valid = false;
        if (dFin && movDate > dFin) valid = false;
        return valid;
      });
    }

    return result;
  }, [movimientos, filterTipo, searchQuery, fechaInicio, fechaFin]);

  if (showAddForm) {
    return (
      <MovimientoRealFormView 
        isDark={isDark} 
        userId={userId} 
        onBack={() => setShowAddForm(false)} 
        onSaved={() => {
          setShowAddForm(false);
          fetchMovimientos();
        }}
      />
    );
  }

  if (selectedMovimiento) {
    return (
      <MovimientoRealDetailView 
        isDark={isDark} 
        userId={userId} 
        movimiento={selectedMovimiento} 
        onBack={() => setSelectedMovimiento(null)} 
        onRefresh={fetchMovimientos} 
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER DE LA SECCIÓN */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackMenu} style={{ marginRight: 10, padding: 5 }}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Historial de Movimientos
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding} keyboardShouldPersistTaps="handled">
        
        {/* PANEL DE FILTROS */}
        <View style={[styles.filterPanel, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          
          {/* Segmented Buttons for Type */}
          <View style={styles.segmentedControl}>
            {['Todos', 'Ingreso', 'Egreso'].map(tipo => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.segmentBtn,
                  filterTipo === tipo && { backgroundColor: theme.accent, borderColor: theme.accent }
                ]}
                onPress={() => setFilterTipo(tipo)}
              >
                <Text style={[
                  styles.segmentText,
                  { color: filterTipo === tipo ? '#FFF' : theme.textSecondary }
                ]}>
                  {tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Buscador de texto */}
          <View style={[styles.searchBox, { borderColor: theme.inputBorder }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Buscar categoría o billetera..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filtro Rango de Fechas */}
          <View style={styles.dateRow}>
            <View style={[styles.dateInputContainer, { borderColor: theme.inputBorder }]}>
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Desde:</Text>
              <TextInput
                style={[styles.dateInput, { color: theme.textPrimary }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={fechaInicio}
                onChangeText={(t) => handleDateInput(t, setFechaInicio)}
                maxLength={10}
              />
            </View>
            <View style={{ width: 10 }} />
            <View style={[styles.dateInputContainer, { borderColor: theme.inputBorder }]}>
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Hasta:</Text>
              <TextInput
                style={[styles.dateInput, { color: theme.textPrimary }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={fechaFin}
                onChangeText={(t) => handleDateInput(t, setFechaFin)}
                maxLength={10}
              />
            </View>
          </View>

        </View>

        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            Resultados
          </Text>
          <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.countBadgeText}>{filteredMovimientos.length}</Text>
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
            Registrar Movimiento
          </Text>
        </TouchableOpacity>

        {/* LISTA */}
        {filteredMovimientos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={42} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
              No se encontraron movimientos.
            </Text>
          </View>
        ) : (
          filteredMovimientos.map(m => {
            const isIngreso = m.categoria === 'Ingreso';
            const iconColor = isIngreso ? '#10B981' : '#EF4444';
            // Convertir YYYY-MM-DD a DD/MM/YYYY para la UI list
            const dateParts = m.fecha.split('-');
            const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : m.fecha;

            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.7}
                onPress={() => setSelectedMovimiento(m)}
                style={[
                  styles.movCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    shadowColor: theme.cardShadow
                  }
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: iconColor + '20' }]}>
                  <Ionicons name={isIngreso ? 'arrow-down' : 'arrow-up'} size={20} color={iconColor} />
                </View>
                <View style={styles.movInfo}>
                  <Text style={[styles.movTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                    {m.tipo_nombre}
                  </Text>
                  <Text style={[styles.movSub, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
                    {m.billetera_nombre} • {displayDate}
                  </Text>
                </View>
                <Text style={[styles.movAmount, { color: iconColor, fontFamily: Fonts.bold }]}>
                  {isIngreso ? '+' : '-'}{formatCurrencyVE(m.monto)} {m.moneda}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 18 },
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  filterPanel: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm - 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  dateLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  dateInput: {
    fontSize: 14,
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
  movCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  movInfo: {
    flex: 1,
  },
  movTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  movSub: {
    fontSize: 12,
  },
  movAmount: {
    fontSize: 15,
  }
});
