import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getTasasCambio, getHistorialTasasCambio } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import { syncExchangeRates } from '../../services/api';

export default function TasasCambiariasView({ isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [tasas, setTasas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Calculadora state
  const [monto, setMonto] = useState('1');
  const [origen, setOrigen] = useState('USD');
  const [destino, setDestino] = useState('VES');

  useEffect(() => {
    loadTasas();
  }, []);

  const loadTasas = async () => {
    setLoading(true);
    const data = await getTasasCambio();
    setTasas(data);
    const hist = await getHistorialTasasCambio();
    
    // Ordenar el historial por fecha descendente (más reciente primero)
    const sortedHist = hist.sort((a, b) => {
      const parseDate = (str) => {
        const [d, m, y] = str.split('/');
        return new Date(y, m - 1, d).getTime();
      };
      return parseDate(b.fecha_actualizacion) - parseDate(a.fecha_actualizacion);
    });

    setHistorial(sortedHist);
    
    // Set default selected date if null
    if (sortedHist.length > 0 && !selectedDate) {
      // Tomamos la fecha más reciente disponible
      setSelectedDate(sortedHist[0].fecha_actualizacion);
    }
    
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    const success = await syncExchangeRates();
    if (success) {
      await loadTasas();
      Alert.alert('Éxito', 'Las tasas han sido actualizadas correctamente.');
    } else {
      Alert.alert('Error', 'No se pudieron actualizar las tasas. Verifica tu conexión a internet.');
    }
    setSyncing(false);
  };

  // Filtrar las tasas según la fecha seleccionada
  const tasaUSD = historial.find(t => t.moneda_origen === 'USD' && t.moneda_destino === 'VES' && t.fecha_actualizacion === selectedDate);
  const tasaEUR = historial.find(t => t.moneda_origen === 'EUR' && t.moneda_destino === 'VES' && t.fecha_actualizacion === selectedDate);
  
  // Fechas únicas para el filtro
  const availableDates = useMemo(() => {
    return [...new Set(historial.map(h => h.fecha_actualizacion))];
  }, [historial]);

  // Formato para mostrar precios

  const getHoyString = () => {
    const hoy = new Date();
    const d = String(hoy.getDate()).padStart(2, '0');
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const a = hoy.getFullYear();
    return `${d}/${m}/${a}`;
  };

  const isUpdatedToday = () => {
    if (tasas.length === 0) return false;
    const hoy = getHoyString();
    return tasas.every(t => t.fecha_actualizacion === hoy);
  };

  const calculatedResult = useMemo(() => {
    const valor = parseFloat(monto) || 0;
    if (valor === 0) return '0,00';
    if (origen === destino) return formatCurrencyVE(valor);

    const usdVal = tasaUSD ? tasaUSD.tasa : 0;
    const eurVal = tasaEUR ? tasaEUR.tasa : 0;

    let result = 0;

    if (origen === 'USD') {
      if (destino === 'VES') result = valor * usdVal;
      if (destino === 'EUR') result = valor * (usdVal / eurVal);
    } else if (origen === 'EUR') {
      if (destino === 'VES') result = valor * eurVal;
      if (destino === 'USD') result = valor * (eurVal / usdVal);
    } else if (origen === 'VES') {
      if (destino === 'USD') result = valor / usdVal;
      if (destino === 'EUR') result = valor / eurVal;
    }

    return formatCurrencyVE(result);
  }, [monto, origen, destino, tasaUSD, tasaEUR]);

  const renderMonedaSelector = (current, setter, title) => (
    <View style={styles.selectorBlock}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{title}</Text>
      <View style={styles.chipRow}>
        {['USD', 'EUR', 'VES'].map(m => {
          const isSelected = current === m;
          return (
            <Pressable
              key={m}
              onPress={() => setter(m)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0'),
                  borderColor: isSelected ? theme.accent : theme.inputBorder,
                }
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: isSelected ? '#FFF' : theme.textPrimary, fontFamily: isSelected ? Fonts.bold : Fonts.regular }
              ]}>
                {m}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tasas de Cambio</Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20 }} />
      ) : (
        <>
          {/* Selector de Fechas (Tipo Select) */}
          {availableDates.length > 0 && (
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8 }]}>Filtrar por Fecha:</Text>
              <TouchableOpacity
                style={[styles.selectInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: theme.textPrimary, fontSize: 16 }}>
                  {selectedDate === getHoyString() ? `Hoy (${selectedDate})` : selectedDate}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              
              <Modal visible={showDatePicker} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
                  <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Seleccionar Fecha</Text>
                    <FlatList
                      data={availableDates}
                      keyExtractor={item => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.modalOption, item === selectedDate && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]}
                          onPress={() => {
                            setSelectedDate(item);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={[styles.modalOptionText, { color: theme.textPrimary, fontFamily: item === selectedDate ? Fonts.bold : Fonts.regular }]}>
                            {item === getHoyString() ? `Hoy (${item})` : item}
                          </Text>
                          {item === selectedDate && <Ionicons name="checkmark" size={20} color={theme.accent} />}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          )}

          <View style={styles.ratesContainer}>
            {/* Tarjeta USD */}
            <View style={[styles.rateCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Ionicons name="logo-usd" size={24} color="#22C55E" />
              </View>
              <Text style={[styles.rateTitle, { color: theme.textSecondary }]}>Dólar (USD)</Text>
              <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
                {tasaUSD ? formatCurrencyVE(tasaUSD.tasa) : 'N/A'} <Text style={styles.currencySmall}>VES</Text>
              </Text>
              <Text style={[styles.rateDate, { color: theme.textSecondary }]}>
                Actualizado: {tasaUSD ? tasaUSD.fecha_actualizacion : 'N/A'}
              </Text>
            </View>

            {/* Tarjeta EUR */}
            <View style={[styles.rateCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="logo-euro" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.rateTitle, { color: theme.textSecondary }]}>Euro (EUR)</Text>
              <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
                {tasaEUR ? formatCurrencyVE(tasaEUR.tasa) : 'N/A'} <Text style={styles.currencySmall}>VES</Text>
              </Text>
              <Text style={[styles.rateDate, { color: theme.textSecondary }]}>
                Actualizado: {tasaEUR ? tasaEUR.fecha_actualizacion : 'N/A'}
              </Text>
            </View>
          </View>

          {(!isUpdatedToday() || tasas.length === 0) && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: theme.accent }]}
              onPress={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.syncButtonText}>Consultar / Actualizar Tasas</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* CALCULADORA */}
          <View style={[styles.calculatorCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
            <Text style={[styles.calculatorTitle, { color: theme.textPrimary }]}>
              Calculadora de Divisas
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Monto a convertir</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder },
                ]}
                keyboardType="numeric"
                value={monto}
                onChangeText={text => setMonto(text.replace(/[^0-9.]/g, ''))}
              />
            </View>

            {renderMonedaSelector(origen, setOrigen, 'Tengo')}
            
            <View style={styles.swapIconContainer}>
              <Ionicons name="swap-vertical" size={24} color={theme.textSecondary} />
            </View>

            {renderMonedaSelector(destino, setDestino, 'Quiero')}

            <View style={[styles.resultContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Resultado</Text>
              <Text style={[styles.resultValue, { color: theme.accent }]}>
                {calculatedResult} <Text style={styles.resultCurrency}>{destino}</Text>
              </Text>
            </View>

          </View>

          <View style={styles.divider} />

          {/* HISTORIAL PAGINADO */}
          <Text style={[styles.headerTitle, { color: theme.textPrimary, marginTop: Spacing.md }]}>Historial de Tasas</Text>
          <View style={[styles.historyCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
            {historial.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.md }}>No hay historial disponible.</Text>
            ) : (
              <>
                {historial.slice((page - 1) * 5, page * 5).map((h, index, arr) => (
                  <View key={h.id.toString()} style={[styles.historyRow, index !== arr.length - 1 && { borderBottomColor: theme.inputBorder, borderBottomWidth: 1 }]}>
                    <View style={styles.historyIconBox}>
                      <Ionicons name={h.moneda_origen === 'USD' ? 'logo-usd' : 'logo-euro'} size={18} color={h.moneda_origen === 'USD' ? '#22C55E' : '#3B82F6'} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyRate, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                        1 {h.moneda_origen} = {formatCurrencyVE(h.tasa)} {h.moneda_destino}
                      </Text>
                      <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                        {h.fecha_actualizacion}
                      </Text>
                    </View>
                  </View>
                ))}
                {historial.length > 5 && (
                  <View style={[styles.paginationRow, { borderTopColor: theme.inputBorder }]}>
                    <TouchableOpacity 
                      disabled={page === 1} 
                      onPress={() => setPage(page - 1)}
                      style={[styles.pageButton, page === 1 && { opacity: 0.5 }]}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.accent} />
                      <Text style={[styles.pageButtonText, { color: theme.accent }]}>Anterior</Text>
                    </TouchableOpacity>
                    
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      Página {page} de {Math.ceil(historial.length / 5)}
                    </Text>

                    <TouchableOpacity 
                      disabled={page >= Math.ceil(historial.length / 5)} 
                      onPress={() => setPage(page + 1)}
                      style={[styles.pageButton, page >= Math.ceil(historial.length / 5) && { opacity: 0.5 }]}
                    >
                      <Text style={[styles.pageButtonText, { color: theme.accent }]}>Siguiente</Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.accent} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    marginBottom: Spacing.md,
  },
  ratesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  rateCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  rateTitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginBottom: 4,
  },
  rateValue: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: 4,
  },
  currencySmall: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  rateDate: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  syncButtonText: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginBottom: Spacing.lg,
  },
  calculatorCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  calculatorTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  selectorBlock: {
    marginBottom: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chipText: {
    fontSize: 15,
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  resultContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  resultLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginBottom: 4,
  },
  resultValue: {
    fontFamily: Fonts.bold,
    fontSize: 28,
  },
  resultCurrency: {
    fontSize: 16,
    color: '#6B7280',
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyRate: {
    fontSize: 15,
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  modalOptionText: {
    fontSize: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    padding: Spacing.md,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginHorizontal: 4,
  },
});
