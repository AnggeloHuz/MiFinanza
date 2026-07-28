import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getAllCreditos } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import CreditoFormView from './CreditoFormView';
import CreditoDetailView from './CreditoDetailView';

// Iconos por entidad
const ENTIDAD_ICONS = {
  Empresa: 'business-outline',
  Persona: 'person-outline',
  Banco: 'business-outline',
};

const ENTIDAD_COLORS = {
  Empresa: '#3B82F6',
  Persona: '#10B981',
  Banco: '#8B5CF6',
};

export default function CreditosView({ isDark, userId, onBackMenu }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [creditos, setCreditos] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCredito, setSelectedCredito] = useState(null);

  // Filtros
  const [filterEstatus, setFilterEstatus] = useState('Todos'); // 'Todos' | 'sin pagar' | 'pagado'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCreditos();
  }, [userId]);

  const fetchCreditos = async () => {
    try {
      const data = await getAllCreditos(userId);
      setCreditos(data);
    } catch (e) {
      console.error('Error al obtener créditos:', e);
    }
  };

  const filteredCreditos = useMemo(() => {
    let result = creditos;

    if (filterEstatus !== 'Todos') {
      result = result.filter(c => c.estatus === filterEstatus);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.nombre.toLowerCase().includes(lowerQuery) ||
        c.entidad.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [creditos, filterEstatus, searchQuery]);

  if (showAddForm) {
    return (
      <CreditoFormView 
        isDark={isDark} 
        userId={userId} 
        onBack={() => setShowAddForm(false)} 
        onSaved={() => {
          setShowAddForm(false);
          fetchCreditos();
        }}
      />
    );
  }

  if (selectedCredito) {
    return (
      <CreditoDetailView 
        isDark={isDark} 
        userId={userId} 
        credito={selectedCredito} 
        onBack={() => setSelectedCredito(null)} 
        onRefresh={fetchCreditos} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackMenu} style={{ marginRight: 10, padding: 5 }}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Cuentas por Pagar
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding} keyboardShouldPersistTaps="handled">
        
        {/* PANEL DE FILTROS */}
        <View style={[styles.filterPanel, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          
          <View style={styles.segmentedControl}>
            {['Todos', 'sin pagar', 'pagado'].map(estatus => (
              <TouchableOpacity
                key={estatus}
                style={[
                  styles.segmentBtn,
                  filterEstatus === estatus && { backgroundColor: theme.accent }
                ]}
                onPress={() => setFilterEstatus(estatus)}
              >
                <Text style={[
                  styles.segmentText,
                  { color: filterEstatus === estatus ? '#FFF' : theme.textSecondary, fontFamily: filterEstatus === estatus ? Fonts.bold : Fonts.medium }
                ]}>
                  {estatus === 'sin pagar' ? 'Sin Pagar' : estatus === 'pagado' ? 'Pagados' : 'Todos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.searchBox, { backgroundColor: theme.background, borderColor: theme.inputBorder }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Buscar por nombre o entidad..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* BOTÓN AGREGAR */}
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(26, 171, 138, 0.15)' : 'rgba(26, 171, 138, 0.1)', borderColor: theme.accent }]}
          onPress={() => setShowAddForm(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
          <Text style={[styles.addBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            Registrar Nuevo Crédito
          </Text>
        </TouchableOpacity>

        {/* LISTADO */}
        {filteredCreditos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
              {searchQuery ? 'No se encontraron resultados.' : 'No tienes créditos registrados.'}
            </Text>
          </View>
        ) : (
          filteredCreditos.map(item => {
            const isPagado = item.estatus === 'pagado';
            const iconName = ENTIDAD_ICONS[item.entidad] || 'business-outline';
            const iconColor = ENTIDAD_COLORS[item.entidad] || theme.accent;

            return (
              <TouchableOpacity
                key={item.id.toString()}
                activeOpacity={0.8}
                onPress={() => setSelectedCredito(item)}
                style={[
                  styles.creditoCard,
                  { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                  isPagado && { opacity: 0.7 }
                ]}
              >
                <View style={[styles.avatarBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Ionicons name={iconName} size={24} color={iconColor} />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
                    {item.entidad} • {item.moneda} • Vence: {item.fecha_pago}
                  </Text>
                </View>

                <View style={styles.montoBox}>
                  <Text style={[styles.montoText, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                    {formatCurrencyVE(item.monto)} {item.moneda}
                  </Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: isPagado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: isPagado ? '#10B981' : '#EF4444', fontFamily: Fonts.bold }
                    ]}>
                      {isPagado ? 'Pagado' : 'Sin Pagar'}
                    </Text>
                  </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 18,
  },
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  filterPanel: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.sm,
    padding: 4,
    marginBottom: Spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: BorderRadius.sm - 2,
  },
  segmentText: {
    fontSize: 13,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
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
  creditoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  montoBox: {
    alignItems: 'flex-end',
  },
  montoText: {
    fontSize: 15,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    textTransform: 'uppercase',
  }
});
