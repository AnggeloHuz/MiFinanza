import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getAllBilleteras, getAllCreditos, getAllCobranzas, getTasasCambio, getAllMovimientos, getHistorialTasasCambio } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';

export default function DashboardView({ isDark, user, onNavigate }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [billeteras, setBilleteras] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [cobranzas, setCobranzas] = useState([]);
  const [tasas, setTasas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [historialTasas, setHistorialTasas] = useState([]);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('VES');
  const [selectedDateOption, setSelectedDateOption] = useState('Hoy');
  const [showDateModal, setShowDateModal] = useState(false);
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const [bills, creds, cobs, rates, movs, histRates] = await Promise.all([
        getAllBilleteras(user.id),
        getAllCreditos(user.id),
        getAllCobranzas(user.id),
        getTasasCambio(),
        getAllMovimientos(user.id),
        getHistorialTasasCambio()
      ]);
      setBilleteras(bills);
      setCreditos(creds);
      setCobranzas(cobs);
      setTasas(rates);
      setMovimientos(movs);
      setHistorialTasas(histRates);
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

  const patrimonioData = useMemo(() => {
    let neto = 0;
    let deudas = 0;
    let porCobrar = 0;

    const today = new Date();
    let targetDateObj = new Date(today);
    targetDateObj.setHours(23, 59, 59, 999);

    if (selectedDateOption === 'Ayer') {
      targetDateObj.setDate(targetDateObj.getDate() - 1);
    } else if (selectedDateOption === 'Hace 7 días') {
      targetDateObj.setDate(targetDateObj.getDate() - 7);
    } else if (selectedDateOption === 'Hace 30 días') {
      targetDateObj.setDate(targetDateObj.getDate() - 30);
    } else if (selectedDateOption !== 'Hoy') {
      const parts = selectedDateOption.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          targetDateObj = new Date(y, m, d, 23, 59, 59, 999);
        }
      }
    }

    const parseToStandardDate = (dStr) => {
      if (!dStr) return null;
      let s = String(dStr).trim();
      if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      } else if (s.includes('-')) {
        const datePart = s.split(' ')[0].split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
            return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          }
        }
      }
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const isHistorical = selectedDateOption !== 'Hoy';
    const targetTs = targetDateObj.getTime();

    let ratesToUse = tasas;
    if (isHistorical && historialTasas.length > 0) {
      let bestRates = {};

      historialTasas.forEach(ht => {
        const htDate = parseToStandardDate(ht.fecha_actualizacion);
        if (htDate) {
          htDate.setHours(23, 59, 59, 999);
          const htTs = htDate.getTime();
          if (htTs <= targetTs) {
            const key = `${ht.moneda_origen}-${ht.moneda_destino}`;
            if (!bestRates[key] || htTs > bestRates[key].ts) {
              bestRates[key] = { tasa: ht.tasa, ts: htTs, ...ht };
            }
          }
        }
      });
      const historicalRates = Object.values(bestRates);
      if (historicalRates.length > 0) ratesToUse = historicalRates;
    }

    const convertir = (valor, monedaOrigen, monedaDestino) => {
      if (!valor || isNaN(valor)) return 0;
      if (monedaOrigen === monedaDestino) return valor;
      const tasaUSD = ratesToUse.find(t => t.moneda_origen === 'USD' && t.moneda_destino === 'VES')?.tasa || 1;
      const tasaEUR = ratesToUse.find(t => t.moneda_origen === 'EUR' && t.moneda_destino === 'VES')?.tasa || 1;

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
      }
      return result;
    };

    // 1. Calcular Balances de Billeteras con saldo inicial derivado + movimientos históricos
    billeteras.forEach(bill => {
      const allMovsForBill = movimientos.filter(m => m.billetera_id === bill.id);
      
      let totalMovs = 0;
      allMovsForBill.forEach(m => {
        if (m.categoria === 'Ingreso') totalMovs += m.monto;
        if (m.categoria === 'Egreso') totalMovs -= m.monto;
      });

      const initialBalance = bill.balance - totalMovs;

      let pastMovs = 0;
      allMovsForBill.forEach(m => {
        const movDate = parseToStandardDate(m.fecha);
        if (movDate && movDate.getTime() <= targetTs) {
          if (m.categoria === 'Ingreso') pastMovs += m.monto;
          if (m.categoria === 'Egreso') pastMovs -= m.monto;
        }
      });

      const finalBalance = initialBalance + pastMovs;
      neto += convertir(finalBalance, bill.moneda_abreviatura, monedaSeleccionada);
    });

    // 2. Calcular Deudas
    creditos.forEach(cred => {
      if (!isHistorical) {
        if (cred.estatus === 'sin pagar') deudas += convertir(cred.monto, cred.moneda, monedaSeleccionada);
      } else {
        const createdDate = parseToStandardDate(cred.created_at);
        if (createdDate) createdDate.setHours(0, 0, 0, 0);
        const isCreatedBefore = !createdDate || createdDate.getTime() <= targetTs;

        if (isCreatedBefore) {
          if (cred.estatus === 'sin pagar') {
            deudas += convertir(cred.monto, cred.moneda, monedaSeleccionada);
          } else if (cred.movimiento_id) {
            const movPago = movimientos.find(m => m.id === cred.movimiento_id);
            const pagoDate = movPago ? parseToStandardDate(movPago.fecha) : null;
            if (pagoDate) {
              pagoDate.setHours(23, 59, 59, 999);
              // Si la fecha de creación fue menor a la fecha de pago y el pago se realizó DESPUÉS de la fecha consultada,
              // entonces en la fecha consultada la deuda seguía activa.
              if (pagoDate.getTime() > targetTs) {
                deudas += convertir(cred.monto, cred.moneda, monedaSeleccionada);
              }
            }
          }
        }
      }
    });

    // 3. Calcular Por Cobrar
    cobranzas.forEach(cob => {
      if (!isHistorical) {
        if (cob.estatus === 'sin cobrar') porCobrar += convertir(cob.monto, cob.moneda, monedaSeleccionada);
      } else {
        const createdDate = parseToStandardDate(cob.created_at);
        if (createdDate) createdDate.setHours(0, 0, 0, 0);
        const isCreatedBefore = !createdDate || createdDate.getTime() <= targetTs;

        if (isCreatedBefore) {
          if (cob.estatus === 'sin cobrar') {
            porCobrar += convertir(cob.monto, cob.moneda, monedaSeleccionada);
          } else if (cob.movimiento_id) {
            const movCobro = movimientos.find(m => m.id === cob.movimiento_id);
            const cobroDate = movCobro ? parseToStandardDate(movCobro.fecha) : null;
            if (cobroDate) {
              cobroDate.setHours(23, 59, 59, 999);
              // Si el cobro se realizó DESPUÉS de la fecha consultada, en esa fecha aún estaba por cobrar
              if (cobroDate.getTime() > targetTs) {
                porCobrar += convertir(cob.monto, cob.moneda, monedaSeleccionada);
              }
            }
          }
        }
      }
    });

    return { neto, deudas, porCobrar, total: neto - deudas + porCobrar };
  }, [billeteras, creditos, cobranzas, movimientos, historialTasas, tasas, monedaSeleccionada, selectedDateOption]);

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            Resumen Financiero
          </Text>
          <TouchableOpacity
            style={[styles.dateSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}
            onPress={() => {
              setIsCustomDateMode(false);
              setCustomDateInput('');
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={14} color={theme.textPrimary} style={{ marginRight: 6 }} />
            <Text style={{ color: theme.textPrimary, fontFamily: Fonts.medium, fontSize: 12 }}>
              {selectedDateOption}
            </Text>
            <Ionicons name="chevron-down" size={14} color={theme.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
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
      </TouchableOpacity>

      {/* SECCIÓN DE ESTADÍSTICAS Y GRÁFICOS */}
      <View style={styles.statsSection}>
        <View style={styles.statsSectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            Estadísticas y Gráficos
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
            Análisis visual de tus finanzas
          </Text>
        </View>

        {/* 1. Gráfico de Movimientos (Gastos) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigate && onNavigate('estadisticas', { initialView: 'gastos' })}
          style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={[styles.statsIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="pie-chart-outline" size={24} color="#EF4444" />
          </View>
          <View style={styles.statsContent}>
            <Text style={[styles.statsCardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Gráfico de Movimientos (Gastos)
            </Text>
            <Text style={[styles.statsCardDesc, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Distribución por tipo de movimiento en barras o pizza con leyenda
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* 2. Gráfico de Ingresos */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigate && onNavigate('estadisticas', { initialView: 'ingresos' })}
          style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={[styles.statsIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="trending-up-outline" size={24} color="#10B981" />
          </View>
          <View style={styles.statsContent}>
            <Text style={[styles.statsCardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Gráfico de Ingresos
            </Text>
            <Text style={[styles.statsCardDesc, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Visualización de fuentes de ingresos en barras o pizza con leyenda
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* 3. Gráficos de Billeteras */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigate && onNavigate('estadisticas', { initialView: 'billeteras' })}
          style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={[styles.statsIconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="bar-chart-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.statsContent}>
            <Text style={[styles.statsCardTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Gráficos de Billeteras
            </Text>
            <Text style={[styles.statsCardDesc, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Billetera con más movimiento y análisis de estabilidad
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* MODAL DE SELECTOR DE FECHA */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              {isCustomDateMode ? 'Fecha Personalizada' : 'Consultar Patrimonio al:'}
            </Text>

            {!isCustomDateMode ? (
              <View>
                {['Hoy', 'Ayer', 'Hace 7 días', 'Hace 30 días'].map((opcion) => (
                  <TouchableOpacity
                    key={opcion}
                    style={[
                      styles.modalOption,
                      selectedDateOption === opcion && { backgroundColor: theme.accent + '20' }
                    ]}
                    onPress={() => {
                      setSelectedDateOption(opcion);
                      setShowDateModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      { color: selectedDateOption === opcion ? theme.accent : theme.textPrimary, fontFamily: selectedDateOption === opcion ? Fonts.bold : Fonts.regular }
                    ]}>
                      {opcion}
                    </Text>
                    {selectedDateOption === opcion && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => setIsCustomDateMode(true)}
                >
                  <Text style={[styles.modalOptionText, { color: theme.textPrimary, fontFamily: Fonts.regular }]}>
                    Fecha Personalizada...
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ color: theme.textSecondary, fontFamily: Fonts.regular, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
                  Ingresa la fecha (DD/MM/YYYY)
                </Text>
                <TextInput
                  style={[styles.customDateInput, { color: theme.textPrimary, borderColor: theme.inputBorder }]}
                  placeholder="Ej: 15/07/2026"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={customDateInput}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9]/g, '');
                    let formatted = cleaned;
                    if (cleaned.length > 2) {
                      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
                    }
                    if (cleaned.length > 4) {
                      formatted = formatted.substring(0, 5) + '/' + cleaned.substring(4, 8);
                    }
                    setCustomDateInput(formatted);
                  }}
                  maxLength={10}
                />

                <TouchableOpacity
                  style={[styles.applyCustomBtn, { backgroundColor: theme.accent }]}
                  onPress={() => {
                    if (customDateInput.length !== 10) {
                      Alert.alert('Error', 'Ingresa una fecha completa válida (DD/MM/YYYY).');
                      return;
                    }
                    const parts = customDateInput.split('/');
                    const d = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    const y = parseInt(parts[2], 10);
                    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) {
                      Alert.alert('Error', 'La fecha ingresada no es válida.');
                      return;
                    }
                    setSelectedDateOption(customDateInput);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={{ color: '#FFF', fontFamily: Fonts.bold }}>Aplicar Fecha</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalCloseBtn, { borderColor: theme.inputBorder }]}
              onPress={() => {
                if (isCustomDateMode) {
                  setIsCustomDateMode(false);
                } else {
                  setShowDateModal(false);
                }
              }}
            >
              <Text style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}>
                {isCustomDateMode ? 'Volver' : 'Cancelar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
  },
  modalCloseBtn: {
    marginTop: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  customDateInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: Fonts.medium,
  },
  applyCustomBtn: {
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statsSection: {
    marginBottom: Spacing.xl,
  },
  statsSectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  statsIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statsContent: {
    flex: 1,
  },
  statsCardTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  statsCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
