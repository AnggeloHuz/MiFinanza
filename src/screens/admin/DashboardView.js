import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getAllBilleteras, getAllCreditos, getAllCobranzas, getTasasCambio } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';

export default function DashboardView({ isDark, user, onNavigate }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [billeteras, setBilleteras] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [cobranzas, setCobranzas] = useState([]);
  const [tasas, setTasas] = useState([]);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('VES');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const [bills, creds, cobs, rates] = await Promise.all([
        getAllBilleteras(user.id),
        getAllCreditos(user.id),
        getAllCobranzas(user.id),
        getTasasCambio()
      ]);
      setBilleteras(bills);
      setCreditos(creds);
      setCobranzas(cobs);
      setTasas(rates);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Convertir un monto de monedaOrigen a la monedaDestino actual usando las tasas
  const convertirMoneda = useCallback((valor, monedaOrigen, monedaDestino) => {
    if (!valor || isNaN(valor)) return 0;
    if (monedaOrigen === monedaDestino) return valor;

    const tasaUSD = tasas.find(t => t.moneda_origen === 'USD' && t.moneda_destino === 'VES')?.tasa || 0;
    const tasaEUR = tasas.find(t => t.moneda_origen === 'EUR' && t.moneda_destino === 'VES')?.tasa || 0;

    let result = 0;

    if (monedaOrigen === 'USD') {
      if (monedaDestino === 'VES') result = valor * tasaUSD;
      if (monedaDestino === 'EUR') result = valor * (tasaUSD / tasaEUR);
    } else if (monedaOrigen === 'EUR') {
      if (monedaDestino === 'VES') result = valor * tasaEUR;
      if (monedaDestino === 'USD') result = valor * (tasaEUR / tasaUSD);
    } else if (monedaOrigen === 'VES') {
      if (monedaDestino === 'USD') result = valor / tasaUSD;
      if (monedaDestino === 'EUR') result = valor / tasaEUR;
    } else if (monedaOrigen === 'COP') {
      // Implementación futura si se agrega COP
      result = 0;
    }

    return result;
  }, [tasas]);

  // Cálculos de Patrimonio
  const patrimonioData = useMemo(() => {
    let neto = 0;
    let deudas = 0;
    let porCobrar = 0;

    // Sumar Billeteras
    billeteras.forEach(bill => {
      neto += convertirMoneda(bill.balance, bill.moneda_abreviatura, monedaSeleccionada);
    });

    // Sumar Deudas (Créditos sin pagar)
    creditos.forEach(cred => {
      if (cred.estatus === 'sin pagar') {
        deudas += convertirMoneda(cred.monto, cred.moneda, monedaSeleccionada);
      }
    });

    // Sumar Por Cobrar (Cobranzas sin cobrar)
    cobranzas.forEach(cob => {
      if (cob.estatus === 'sin cobrar') {
        porCobrar += convertirMoneda(cob.monto, cob.moneda, monedaSeleccionada);
      }
    });

    const total = neto - deudas + porCobrar;

    return {
      neto,
      deudas,
      porCobrar,
      total
    };
  }, [billeteras, creditos, cobranzas, monedaSeleccionada, convertirMoneda]);

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.scrollPadding}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
          Hola, {user?.usuario || 'Usuario'} 👋
        </Text>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Resumen Financiero
        </Text>
      </View>

      {/* Selector de Moneda */}
      <View style={styles.currencySelectorContainer}>
        <Text style={[styles.currencyLabel, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
          Mostrar en:
        </Text>
        <View style={[styles.currencySelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          {['VES', 'USD', 'EUR'].map(moneda => {
            const isSelected = monedaSeleccionada === moneda;
            return (
              <Pressable
                key={moneda}
                onPress={() => setMonedaSeleccionada(moneda)}
                style={[
                  styles.currencyBtn,
                  isSelected && { backgroundColor: theme.accent, shadowColor: theme.accent, elevation: 4, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }
                ]}
              >
                <Text style={[
                  styles.currencyBtnText,
                  { color: isSelected ? '#FFF' : theme.textSecondary, fontFamily: isSelected ? Fonts.bold : Fonts.medium }
                ]}>
                  {moneda}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tarjeta de Patrimonio Total */}
      <View style={[styles.totalCard, { backgroundColor: patrimonioData.total < 0 ? '#EF4444' : theme.accent }]}>
        <View style={styles.totalCardHeader}>
          <FontAwesome5 name="wallet" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={[styles.totalCardTitle, { fontFamily: Fonts.medium }]}>Patrimonio Total</Text>
        </View>
        <Text style={[styles.totalCardAmount, { fontFamily: Fonts.bold }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrencyVE(patrimonioData.total)} <Text style={styles.totalCardCurrency}>{monedaSeleccionada}</Text>
        </Text>
        <Text style={[styles.totalCardSubtitle, { fontFamily: Fonts.regular }]}>
          (Neto - Deudas + Por Cobrar)
        </Text>
      </View>

      {/* Subtarjetas de Detalles */}
      <View style={styles.detailsRow}>
        <View style={[styles.detailCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="cash-outline" size={22} color="#10B981" />
          </View>
          <Text style={[styles.detailTitle, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>Patrimonio Neto</Text>
          <Text style={[styles.detailAmount, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            {formatCurrencyVE(patrimonioData.neto)} <Text style={{ fontSize: 12 }}>{monedaSeleccionada}</Text>
          </Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => onNavigate && onNavigate('creditos', { initialView: 'cobranza' })}
          style={[styles.detailCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="arrow-down-circle-outline" size={22} color="#3B82F6" />
          </View>
          <Text style={[styles.detailTitle, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>Por Cobrar</Text>
          <Text style={[styles.detailAmount, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            {formatCurrencyVE(patrimonioData.porCobrar)} <Text style={{ fontSize: 12 }}>{monedaSeleccionada}</Text>
          </Text>
          <View style={styles.cardActionRow}>
            <Text style={[styles.cardActionText, { color: theme.accent }]}>Ver detalles</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.accent} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => onNavigate && onNavigate('creditos', { initialView: 'creditos' })}
        style={[styles.detailCard, { width: '100%', marginBottom: Spacing.xl, backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
          <Ionicons name="warning-outline" size={22} color="#EF4444" />
        </View>
        <Text style={[styles.detailTitle, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>Deudas por Pagar</Text>
        <Text style={[styles.detailAmount, { color: '#EF4444', fontFamily: Fonts.bold }]}>
          {formatCurrencyVE(patrimonioData.deudas)} <Text style={{ fontSize: 12 }}>{monedaSeleccionada}</Text>
        </Text>
        <View style={styles.cardActionRow}>
          <Text style={[styles.cardActionText, { color: theme.textSecondary }]}>Administrar deudas</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
  },
  currencySelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  currencyLabel: {
    fontSize: 14,
  },
  currencySelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  currencyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  currencyBtnText: {
    fontSize: 13,
  },
  totalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  totalCardTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  totalCardAmount: {
    color: '#FFF',
    fontSize: 38,
    marginVertical: 4,
  },
  totalCardCurrency: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  totalCardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  detailTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailAmount: {
    fontSize: 20,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
});
