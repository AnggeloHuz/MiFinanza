import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getAllMovimientos, getAllBilleteras, getTasasCambio } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import { PieChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function EstadisticasView({ isDark, userId, initialView = 'gastos' }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState(initialView);
  const [filterMoneda, setFilterMoneda] = useState('VES');
  const [loading, setLoading] = useState(true);

  const [movimientos, setMovimientos] = useState([]);
  const [billeteras, setBilleteras] = useState([]);
  const [tasas, setTasas] = useState([]);

  useEffect(() => {
    setActiveTab(initialView);
  }, [initialView]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    if (userId) {
      const [movsData, billData, tasasData] = await Promise.all([
        getAllMovimientos(userId),
        getAllBilleteras(userId),
        getTasasCambio()
      ]);
      setMovimientos(movsData);
      setBilleteras(billData);
      setTasas(tasasData);
    }
    setLoading(false);
  };

  // Convertir monto a la moneda seleccionada
  const convertirMonto = (monto, monedaOrigen, monedaDestino) => {
    if (monedaOrigen === monedaDestino) return monto;

    let montoVES = monto;
    if (monedaOrigen === 'USD') {
      const tasaUSD = tasas.find(t => t.moneda_origen === 'USD' && t.moneda_destino === 'VES')?.tasa || 1;
      montoVES = monto * tasaUSD;
    } else if (monedaOrigen === 'EUR') {
      const tasaEUR = tasas.find(t => t.moneda_origen === 'EUR' && t.moneda_destino === 'VES')?.tasa || 1;
      montoVES = monto * tasaEUR;
    }

    if (monedaDestino === 'VES') return montoVES;
    
    if (monedaDestino === 'USD') {
      const tasaUSD = tasas.find(t => t.moneda_origen === 'USD' && t.moneda_destino === 'VES')?.tasa || 1;
      return montoVES / tasaUSD;
    }
    if (monedaDestino === 'EUR') {
      const tasaEUR = tasas.find(t => t.moneda_origen === 'EUR' && t.moneda_destino === 'VES')?.tasa || 1;
      return montoVES / tasaEUR;
    }
    
    return montoVES;
  };

  // ==========================================
  // DATOS PARA GASTOS (PIE CHART)
  // ==========================================
  const gastosData = useMemo(() => {
    const gastos = movimientos.filter(m => m.categoria === 'Egreso');
    const agrupados = {};
    
    gastos.forEach(g => {
      const tipo = g.tipo_nombre || 'Otros';
      const montoConvertido = convertirMonto(g.monto, g.moneda, filterMoneda);
      if (!agrupados[tipo]) agrupados[tipo] = 0;
      agrupados[tipo] += montoConvertido;
    });

    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1'];
    let index = 0;

    return Object.keys(agrupados).map(key => {
      const color = colors[index % colors.length];
      index++;
      return {
        name: key,
        population: parseFloat(agrupados[key].toFixed(2)),
        color: color,
        legendFontColor: theme.textSecondary,
        legendFontSize: 12
      };
    }).sort((a, b) => b.population - a.population);
  }, [movimientos, filterMoneda, tasas]);

  // ==========================================
  // DATOS PARA INGRESOS (PIE CHART)
  // ==========================================
  const ingresosData = useMemo(() => {
    const ingresos = movimientos.filter(m => m.categoria === 'Ingreso');
    const agrupados = {};
    
    ingresos.forEach(i => {
      const tipo = i.tipo_nombre || 'Otros';
      const montoConvertido = convertirMonto(i.monto, i.moneda, filterMoneda);
      if (!agrupados[tipo]) agrupados[tipo] = 0;
      agrupados[tipo] += montoConvertido;
    });

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#6366F1'];
    let index = 0;

    return Object.keys(agrupados).map(key => {
      const color = colors[index % colors.length];
      index++;
      return {
        name: key,
        population: parseFloat(agrupados[key].toFixed(2)),
        color: color,
        legendFontColor: theme.textSecondary,
        legendFontSize: 12
      };
    }).sort((a, b) => b.population - a.population);
  }, [movimientos, filterMoneda, tasas]);

  // ==========================================
  // DATOS PARA BILLETERAS (BAR CHART)
  // ==========================================
  const billeterasData = useMemo(() => {
    const volumenes = billeteras.map(b => {
      const movsBilletera = movimientos.filter(m => m.billetera_nombre === b.nombre);
      let ingresos = 0;
      let egresos = 0;

      movsBilletera.forEach(m => {
        const montoConvertido = convertirMonto(m.monto, m.moneda, filterMoneda);
        if (m.categoria === 'Ingreso') ingresos += montoConvertido;
        if (m.categoria === 'Egreso') egresos += montoConvertido;
      });

      return {
        nombre: b.nombre,
        ingresos,
        egresos,
        volumenTotal: ingresos + egresos
      };
    }).sort((a, b) => b.volumenTotal - a.volumenTotal).slice(0, 5); // Top 5

    return {
      labels: volumenes.map(v => v.nombre.length > 8 ? v.nombre.substring(0, 8) + '...' : v.nombre),
      datasets: [
        { data: volumenes.map(v => v.volumenTotal) }
      ],
      raw: volumenes
    };
  }, [movimientos, billeteras, filterMoneda, tasas]);

  const chartConfig = {
    backgroundGradientFrom: theme.cardBackground,
    backgroundGradientTo: theme.cardBackground,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontFamily: Fonts.regular,
      fontSize: 10,
    },
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      
      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'gastos' && { borderBottomColor: '#EF4444' }]} 
          onPress={() => setActiveTab('gastos')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'gastos' ? '#EF4444' : theme.textSecondary }]}>Gastos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'ingresos' && { borderBottomColor: '#10B981' }]} 
          onPress={() => setActiveTab('ingresos')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'ingresos' ? '#10B981' : theme.textSecondary }]}>Ingresos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'billeteras' && { borderBottomColor: '#3B82F6' }]} 
          onPress={() => setActiveTab('billeteras')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'billeteras' ? '#3B82F6' : theme.textSecondary }]}>Billeteras</Text>
        </TouchableOpacity>
      </View>

      {/* FILTRO DE MONEDA */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Moneda del Gráfico:</Text>
        <View style={[styles.currencySelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
          {['VES', 'USD', 'EUR'].map((moneda) => (
            <TouchableOpacity
              key={moneda}
              onPress={() => setFilterMoneda(moneda)}
              style={[
                styles.currencyBtn,
                filterMoneda === moneda && { backgroundColor: theme.cardBackground }
              ]}
            >
              <Text style={[
                styles.currencyBtnText,
                { color: filterMoneda === moneda ? theme.textPrimary : theme.textSecondary, fontFamily: filterMoneda === moneda ? Fonts.bold : Fonts.regular }
              ]}>{moneda}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.chartWrapper}>
          
          {/* GASTOS */}
          {activeTab === 'gastos' && (
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Distribución de Gastos</Text>
              {gastosData.length > 0 ? (
                <>
                  <PieChart
                    data={gastosData}
                    width={screenWidth - Spacing.lg * 2 - 32} // padding adjustments
                    height={220}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={screenWidth / 4}
                    center={[0, 0]}
                    absolute
                    hasLegend={false}
                  />
                  <View style={styles.legendDetails}>
                    <Text style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: Fonts.bold }}>Totales ({filterMoneda}):</Text>
                    {gastosData.map((d, i) => (
                      <View key={i} style={styles.legendRow}>
                        <View style={styles.legendColorBox}>
                          <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                          <Text style={[styles.legendName, { color: theme.textPrimary }]}>{d.name}</Text>
                        </View>
                        <Text style={[styles.legendAmount, { color: theme.textPrimary }]}>{formatCurrencyVE(d.population)}</Text>
                      </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.legendRow}>
                      <Text style={[styles.legendName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>TOTAL</Text>
                      <Text style={[styles.legendAmount, { color: '#EF4444', fontFamily: Fonts.bold }]}>
                        {formatCurrencyVE(gastosData.reduce((acc, curr) => acc + curr.population, 0))}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>No hay gastos registrados para graficar.</Text>
              )}
            </View>
          )}

          {/* INGRESOS */}
          {activeTab === 'ingresos' && (
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Distribución de Ingresos</Text>
              {ingresosData.length > 0 ? (
                <>
                  <PieChart
                    data={ingresosData}
                    width={screenWidth - Spacing.lg * 2 - 32}
                    height={220}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={screenWidth / 4}
                    center={[0, 0]}
                    absolute
                    hasLegend={false}
                  />
                  <View style={styles.legendDetails}>
                    <Text style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: Fonts.bold }}>Totales ({filterMoneda}):</Text>
                    {ingresosData.map((d, i) => (
                      <View key={i} style={styles.legendRow}>
                        <View style={styles.legendColorBox}>
                          <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                          <Text style={[styles.legendName, { color: theme.textPrimary }]}>{d.name}</Text>
                        </View>
                        <Text style={[styles.legendAmount, { color: theme.textPrimary }]}>{formatCurrencyVE(d.population)}</Text>
                      </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.legendRow}>
                      <Text style={[styles.legendName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>TOTAL</Text>
                      <Text style={[styles.legendAmount, { color: '#10B981', fontFamily: Fonts.bold }]}>
                        {formatCurrencyVE(ingresosData.reduce((acc, curr) => acc + curr.population, 0))}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>No hay ingresos registrados para graficar.</Text>
              )}
            </View>
          )}

          {/* BILLETERAS */}
          {activeTab === 'billeteras' && (
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Volumen de Movimiento (Top 5)</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: Spacing.md }}>
                Suma total de dinero que entró y salió de cada billetera.
              </Text>
              
              {billeterasData.labels.length > 0 ? (
                <>
                  <BarChart
                    data={billeterasData}
                    width={screenWidth - Spacing.lg * 2 - 32}
                    height={260}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: (opacity = 1) => theme.textSecondary,
                    }}
                    verticalLabelRotation={30}
                    fromZero={true}
                    showValuesOnTopOfBars={false}
                    formatYLabel={(yValue) => formatCurrencyVE(yValue, false)}
                    style={{ marginVertical: 8, borderRadius: BorderRadius.md }}
                  />
                  
                  <View style={styles.legendDetails}>
                    <Text style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: Fonts.bold }}>Desglose por Billetera ({filterMoneda}):</Text>
                    {billeterasData.raw.map((d, i) => (
                      <View key={i} style={[styles.legendRow, { marginBottom: Spacing.sm }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.legendName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>{d.nombre}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={{ color: '#10B981', fontSize: 12 }}>+ {formatCurrencyVE(d.ingresos)}</Text>
                          <Text style={{ color: '#EF4444', fontSize: 12 }}>- {formatCurrencyVE(d.egresos)}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={[styles.legendAmount, { color: '#3B82F6', fontFamily: Fonts.bold }]}>{formatCurrencyVE(d.volumenTotal)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>No hay movimientos en billeteras para analizar.</Text>
              )}
            </View>
          )}

        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  currencySelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  currencyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  currencyBtnText: {
    fontSize: 12,
  },
  chartWrapper: {
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  legendDetails: {
    marginTop: Spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColorBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendName: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  legendAmount: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
});
