import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getAllMovimientos, getAllBilleteras, getTasasCambio } from '../../database/database';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import { PieChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const PALETTE = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#06B6D4'
];

export default function EstadisticasView({ isDark, userId, initialView = 'gastos', onBackMenu }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState(initialView); // 'gastos' | 'ingresos' | 'billeteras'
  const [filterMoneda, setFilterMoneda] = useState('VES');
  const [chartTypeGastos, setChartTypeGastos] = useState('pie'); // 'pie' | 'bar'
  const [chartTypeIngresos, setChartTypeIngresos] = useState('pie'); // 'pie' | 'bar'
  const [loading, setLoading] = useState(true);

  const [movimientos, setMovimientos] = useState([]);
  const [billeteras, setBilleteras] = useState([]);
  const [tasas, setTasas] = useState([]);

  useEffect(() => {
    if (initialView) {
      setActiveTab(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    if (userId) {
      try {
        const [movsData, billData, tasasData] = await Promise.all([
          getAllMovimientos(userId),
          getAllBilleteras(userId),
          getTasasCambio()
        ]);
        setMovimientos(movsData || []);
        setBilleteras(billData || []);
        setTasas(tasasData || []);
      } catch (e) {
        console.error('Error al cargar datos de estadísticas:', e);
      }
    }
    setLoading(false);
  };

  // Convertir monto a la moneda seleccionada
  const convertirMonto = (monto, monedaOrigen, monedaDestino) => {
    if (!monto || isNaN(monto)) return 0;
    if (monedaOrigen === monedaDestino) return monto;

    const tasaUSD = tasas.find(t => t.moneda_origen === 'USD' && t.moneda_destino === 'VES')?.tasa || 1;
    const tasaEUR = tasas.find(t => t.moneda_origen === 'EUR' && t.moneda_destino === 'VES')?.tasa || 1;

    let montoVES = monto;
    if (monedaOrigen === 'USD') montoVES = monto * tasaUSD;
    else if (monedaOrigen === 'EUR') montoVES = monto * tasaEUR;

    if (monedaDestino === 'VES') return montoVES;
    if (monedaDestino === 'USD') return montoVES / tasaUSD;
    if (monedaDestino === 'EUR') return montoVES / tasaEUR;

    return montoVES;
  };

  // ==========================================
  // DATOS PARA GASTOS (EGRESOS)
  // ==========================================
  const { gastosData, totalGastos, gastosBarChartData } = useMemo(() => {
    const gastos = movimientos.filter(m => m.categoria === 'Egreso');
    const agrupados = {};

    gastos.forEach(g => {
      const tipo = g.tipo_nombre || 'Otros';
      const montoConvertido = convertirMonto(g.monto, g.moneda, filterMoneda);
      if (!agrupados[tipo]) agrupados[tipo] = 0;
      agrupados[tipo] += montoConvertido;
    });

    const sumTotal = Object.values(agrupados).reduce((a, b) => a + b, 0);

    const list = Object.keys(agrupados).map((key, index) => {
      const val = agrupados[key];
      const pct = sumTotal > 0 ? (val / sumTotal) * 100 : 0;
      return {
        name: key,
        population: parseFloat(val.toFixed(2)),
        percentage: pct.toFixed(1),
        color: PALETTE[index % PALETTE.length],
        legendFontColor: theme.textSecondary,
        legendFontSize: 12
      };
    }).sort((a, b) => b.population - a.population);

    const top5 = list.slice(0, 5);
    const barData = {
      labels: top5.map(item => item.name.length > 7 ? item.name.substring(0, 7) + '..' : item.name),
      datasets: [{ data: top5.map(item => item.population) }],
      raw: top5
    };

    return { gastosData: list, totalGastos: sumTotal, gastosBarChartData: barData };
  }, [movimientos, filterMoneda, tasas, theme]);

  // ==========================================
  // DATOS PARA INGRESOS
  // ==========================================
  const { ingresosData, totalIngresos, ingresosBarChartData } = useMemo(() => {
    const ingresos = movimientos.filter(m => m.categoria === 'Ingreso');
    const agrupados = {};

    ingresos.forEach(i => {
      const tipo = i.tipo_nombre || 'Otros';
      const montoConvertido = convertirMonto(i.monto, i.moneda, filterMoneda);
      if (!agrupados[tipo]) agrupados[tipo] = 0;
      agrupados[tipo] += montoConvertido;
    });

    const sumTotal = Object.values(agrupados).reduce((a, b) => a + b, 0);

    const list = Object.keys(agrupados).map((key, index) => {
      const val = agrupados[key];
      const pct = sumTotal > 0 ? (val / sumTotal) * 100 : 0;
      return {
        name: key,
        population: parseFloat(val.toFixed(2)),
        percentage: pct.toFixed(1),
        color: PALETTE[index % PALETTE.length],
        legendFontColor: theme.textSecondary,
        legendFontSize: 12
      };
    }).sort((a, b) => b.population - a.population);

    const top5 = list.slice(0, 5);
    const barData = {
      labels: top5.map(item => item.name.length > 7 ? item.name.substring(0, 7) + '..' : item.name),
      datasets: [{ data: top5.map(item => item.population) }],
      raw: top5
    };

    return { ingresosData: list, totalIngresos: sumTotal, ingresosBarChartData: barData };
  }, [movimientos, filterMoneda, tasas, theme]);

  // ==========================================
  // DATOS PARA BILLETERAS (VOLUMEN Y ESTABILIDAD)
  // ==========================================
  const { billeterasVolumen, topVolumenWallet, topStableWallet, barChartVolumenData, barChartEstabilidadData } = useMemo(() => {
    const list = billeteras.map(b => {
      const movs = movimientos.filter(m => m.billetera_id === b.id || m.billetera_nombre === b.nombre);
      let ingresos = 0;
      let egresos = 0;
      let count = movs.length;

      movs.forEach(m => {
        const montoConv = convertirMonto(m.monto, m.moneda, filterMoneda);
        if (m.categoria === 'Ingreso') ingresos += montoConv;
        if (m.categoria === 'Egreso') egresos += montoConv;
      });

      const balanceConv = convertirMonto(b.balance, b.moneda_abreviatura, filterMoneda);
      const volumenTotal = ingresos + egresos;

      // Ratio de Estabilidad (0 a 100%):
      let estabilidadScore = 100;
      if (volumenTotal > 0) {
        const ratioRetencion = Math.max(0, (balanceConv / (balanceConv + egresos)));
        estabilidadScore = Math.min(100, Math.max(0, ratioRetencion * 100));
      }

      return {
        id: b.id,
        nombre: b.nombre,
        monedaOriginal: b.moneda_abreviatura,
        balance: balanceConv,
        ingresos,
        egresos,
        volumenTotal,
        transacciones: count,
        estabilidadScore: parseFloat(estabilidadScore.toFixed(1))
      };
    });

    // Ordenados por volumen
    const sortedByVolumen = [...list].sort((a, b) => b.volumenTotal - a.volumenTotal);
    // Ordenados por estabilidad (balance positivo y alto score)
    const sortedByStability = [...list].sort((a, b) => b.estabilidadScore - a.estabilidadScore || b.balance - a.balance);

    const topMov = sortedByVolumen.length > 0 ? sortedByVolumen[0] : null;
    const topStab = sortedByStability.length > 0 ? sortedByStability[0] : null;

    const top5Vol = sortedByVolumen.slice(0, 5);
    const barVol = {
      labels: top5Vol.map(v => v.nombre.length > 7 ? v.nombre.substring(0, 7) + '..' : v.nombre),
      datasets: [{ data: top5Vol.map(v => Math.max(0, v.volumenTotal)) }],
      raw: top5Vol
    };

    const top5Stab = sortedByStability.slice(0, 5);
    const barStab = {
      labels: top5Stab.map(v => v.nombre.length > 7 ? v.nombre.substring(0, 7) + '..' : v.nombre),
      datasets: [{ data: top5Stab.map(v => v.estabilidadScore) }],
      raw: top5Stab
    };

    return {
      billeterasVolumen: sortedByVolumen,
      topVolumenWallet: topMov,
      topStableWallet: topStab,
      barChartVolumenData: barVol,
      barChartEstabilidadData: barStab
    };
  }, [movimientos, billeteras, filterMoneda, tasas]);

  const chartConfig = {
    backgroundGradientFrom: theme.cardBackground,
    backgroundGradientTo: theme.cardBackground,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(30, 41, 59, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.55,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontFamily: Fonts.medium,
      fontSize: 10,
    },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollPadding}
    >
      {/* HEADER DE ESTADÍSTICAS */}
      <View style={styles.headerRow}>
        {onBackMenu && (
          <TouchableOpacity onPress={onBackMenu} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            Estadísticas y Análisis
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
            Reportes gráficos de tu actividad financiera
          </Text>
        </View>
      </View>

      {/* TABS SELECTOR */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'gastos' && { backgroundColor: theme.cardBackground, shadowColor: '#000', elevation: 3 }]}
          onPress={() => setActiveTab('gastos')}
        >
          <Ionicons name="pie-chart" size={16} color={activeTab === 'gastos' ? '#EF4444' : theme.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, { color: activeTab === 'gastos' ? '#EF4444' : theme.textSecondary, fontFamily: activeTab === 'gastos' ? Fonts.bold : Fonts.medium }]}>
            Gastos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ingresos' && { backgroundColor: theme.cardBackground, shadowColor: '#000', elevation: 3 }]}
          onPress={() => setActiveTab('ingresos')}
        >
          <Ionicons name="trending-up" size={16} color={activeTab === 'ingresos' ? '#10B981' : theme.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, { color: activeTab === 'ingresos' ? '#10B981' : theme.textSecondary, fontFamily: activeTab === 'ingresos' ? Fonts.bold : Fonts.medium }]}>
            Ingresos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'billeteras' && { backgroundColor: theme.cardBackground, shadowColor: '#000', elevation: 3 }]}
          onPress={() => setActiveTab('billeteras')}
        >
          <Ionicons name="wallet" size={16} color={activeTab === 'billeteras' ? '#3B82F6' : theme.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, { color: activeTab === 'billeteras' ? '#3B82F6' : theme.textSecondary, fontFamily: activeTab === 'billeteras' ? Fonts.bold : Fonts.medium }]}>
            Billeteras
          </Text>
        </TouchableOpacity>
      </View>

      {/* SELECTOR DE MONEDA CONSOLIDADA */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
          Moneda de conversión:
        </Text>
        <View style={[styles.currencySelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
          {['VES', 'USD', 'EUR'].map((moneda) => (
            <TouchableOpacity
              key={moneda}
              onPress={() => setFilterMoneda(moneda)}
              style={[
                styles.currencyBtn,
                filterMoneda === moneda && { backgroundColor: theme.accent }
              ]}
            >
              <Text style={[
                styles.currencyBtnText,
                { color: filterMoneda === moneda ? '#FFF' : theme.textSecondary, fontFamily: filterMoneda === moneda ? Fonts.bold : Fonts.medium }
              ]}>
                {moneda}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.chartWrapper}>

          {/* ======================================================== */}
          {/* 1. GRÁFICO DE GASTOS / EGRESOS                          */}
          {/* ======================================================== */}
          {activeTab === 'gastos' && (
            <View>
              {/* Tarjeta de Resumen Total */}
              <View style={[styles.summaryCard, { backgroundColor: '#EF4444' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="arrow-down-circle" size={28} color="#FFF" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: Fonts.medium }}>Total de Egresos</Text>
                    <Text style={{ color: '#FFF', fontSize: 22, fontFamily: Fonts.bold }}>
                      {formatCurrencyVE(totalGastos)} <Text style={{ fontSize: 14 }}>{filterMoneda}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tarjeta de Gráfico */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Distribución de Gastos</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Por tipo de movimiento</Text>
                  </View>
                  
                  {/* Selector Pizza / Barras */}
                  <View style={[styles.chartTypeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
                    <TouchableOpacity
                      onPress={() => setChartTypeGastos('pie')}
                      style={[styles.chartTypeBtn, chartTypeGastos === 'pie' && { backgroundColor: theme.cardBackground }]}
                    >
                      <Ionicons name="pie-chart" size={16} color={chartTypeGastos === 'pie' ? '#EF4444' : theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setChartTypeGastos('bar')}
                      style={[styles.chartTypeBtn, chartTypeGastos === 'bar' && { backgroundColor: theme.cardBackground }]}
                    >
                      <Ionicons name="bar-chart" size={16} color={chartTypeGastos === 'bar' ? '#EF4444' : theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {gastosData.length > 0 ? (
                  <>
                    {chartTypeGastos === 'pie' ? (
                      <View style={{ alignItems: 'center', marginVertical: 10 }}>
                        <PieChart
                          data={gastosData}
                          width={screenWidth - Spacing.lg * 2 - 32}
                          height={210}
                          chartConfig={chartConfig}
                          accessor={"population"}
                          backgroundColor={"transparent"}
                          paddingLeft={screenWidth / 4.4}
                          center={[0, 0]}
                          absolute
                          hasLegend={false}
                        />
                      </View>
                    ) : (
                      <View style={{ marginVertical: 10 }}>
                        <BarChart
                          data={gastosBarChartData}
                          width={screenWidth - Spacing.lg * 2 - 32}
                          height={230}
                          yAxisLabel=""
                          yAxisSuffix=""
                          chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                            labelColor: (opacity = 1) => theme.textSecondary,
                          }}
                          verticalLabelRotation={25}
                          fromZero={true}
                          showValuesOnTopOfBars={false}
                          formatYLabel={(yValue) => formatCurrencyVE(yValue, false)}
                          style={{ borderRadius: BorderRadius.md }}
                        />
                      </View>
                    )}

                    {/* LEYENDA DETALLADA CON FORMATO VENEZOLANO */}
                    <View style={styles.legendDetails}>
                      <Text style={[styles.legendHeaderTitle, { color: theme.textSecondary, fontFamily: Fonts.bold }]}>
                        Desglose y Leyenda ({filterMoneda}):
                      </Text>
                      {gastosData.map((d, i) => (
                        <View key={i} style={[styles.legendRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                          <View style={styles.legendColorBox}>
                            <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                            <View>
                              <Text style={[styles.legendName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                                {d.name}
                              </Text>
                              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                                {d.percentage}% del total
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.legendAmount, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                            {formatCurrencyVE(d.population)} <Text style={{ fontSize: 11, color: theme.textSecondary }}>{filterMoneda}</Text>
                          </Text>
                        </View>
                      ))}

                      <View style={[styles.totalSummaryRow, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2' }]}>
                        <Text style={[styles.totalLabel, { color: '#EF4444', fontFamily: Fonts.bold }]}>TOTAL GASTOS</Text>
                        <Text style={[styles.totalValue, { color: '#EF4444', fontFamily: Fonts.bold }]}>
                          {formatCurrencyVE(totalGastos)} {filterMoneda}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={40} color={theme.textSecondary} style={{ marginBottom: 8 }} />
                    <Text style={{ color: theme.textSecondary, textAlign: 'center', fontFamily: Fonts.medium }}>
                      No hay gastos registrados para graficar.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* 2. GRÁFICO DE INGRESOS                                  */}
          {/* ======================================================== */}
          {activeTab === 'ingresos' && (
            <View>
              {/* Tarjeta de Resumen Total */}
              <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="arrow-up-circle" size={28} color="#FFF" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: Fonts.medium }}>Total de Ingresos</Text>
                    <Text style={{ color: '#FFF', fontSize: 22, fontFamily: Fonts.bold }}>
                      {formatCurrencyVE(totalIngresos)} <Text style={{ fontSize: 14 }}>{filterMoneda}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tarjeta de Gráfico */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Distribución de Ingresos</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Por tipo de movimiento</Text>
                  </View>
                  
                  {/* Selector Pizza / Barras */}
                  <View style={[styles.chartTypeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
                    <TouchableOpacity
                      onPress={() => setChartTypeIngresos('pie')}
                      style={[styles.chartTypeBtn, chartTypeIngresos === 'pie' && { backgroundColor: theme.cardBackground }]}
                    >
                      <Ionicons name="pie-chart" size={16} color={chartTypeIngresos === 'pie' ? '#10B981' : theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setChartTypeIngresos('bar')}
                      style={[styles.chartTypeBtn, chartTypeIngresos === 'bar' && { backgroundColor: theme.cardBackground }]}
                    >
                      <Ionicons name="bar-chart" size={16} color={chartTypeIngresos === 'bar' ? '#10B981' : theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {ingresosData.length > 0 ? (
                  <>
                    {chartTypeIngresos === 'pie' ? (
                      <View style={{ alignItems: 'center', marginVertical: 10 }}>
                        <PieChart
                          data={ingresosData}
                          width={screenWidth - Spacing.lg * 2 - 32}
                          height={210}
                          chartConfig={chartConfig}
                          accessor={"population"}
                          backgroundColor={"transparent"}
                          paddingLeft={screenWidth / 4.4}
                          center={[0, 0]}
                          absolute
                          hasLegend={false}
                        />
                      </View>
                    ) : (
                      <View style={{ marginVertical: 10 }}>
                        <BarChart
                          data={ingresosBarChartData}
                          width={screenWidth - Spacing.lg * 2 - 32}
                          height={230}
                          yAxisLabel=""
                          yAxisSuffix=""
                          chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                            labelColor: (opacity = 1) => theme.textSecondary,
                          }}
                          verticalLabelRotation={25}
                          fromZero={true}
                          showValuesOnTopOfBars={false}
                          formatYLabel={(yValue) => formatCurrencyVE(yValue, false)}
                          style={{ borderRadius: BorderRadius.md }}
                        />
                      </View>
                    )}

                    {/* LEYENDA DETALLADA CON FORMATO VENEZOLANO */}
                    <View style={styles.legendDetails}>
                      <Text style={[styles.legendHeaderTitle, { color: theme.textSecondary, fontFamily: Fonts.bold }]}>
                        Desglose y Leyenda ({filterMoneda}):
                      </Text>
                      {ingresosData.map((d, i) => (
                        <View key={i} style={[styles.legendRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                          <View style={styles.legendColorBox}>
                            <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                            <View>
                              <Text style={[styles.legendName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                                {d.name}
                              </Text>
                              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                                {d.percentage}% del total
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.legendAmount, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                            {formatCurrencyVE(d.population)} <Text style={{ fontSize: 11, color: theme.textSecondary }}>{filterMoneda}</Text>
                          </Text>
                        </View>
                      ))}

                      <View style={[styles.totalSummaryRow, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#D1FAE5' }]}>
                        <Text style={[styles.totalLabel, { color: '#10B981', fontFamily: Fonts.bold }]}>TOTAL INGRESOS</Text>
                        <Text style={[styles.totalValue, { color: '#10B981', fontFamily: Fonts.bold }]}>
                          {formatCurrencyVE(totalIngresos)} {filterMoneda}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="wallet-outline" size={40} color={theme.textSecondary} style={{ marginBottom: 8 }} />
                    <Text style={{ color: theme.textSecondary, textAlign: 'center', fontFamily: Fonts.medium }}>
                      No hay ingresos registrados para graficar.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* 3. GRÁFICOS DE BILLETERAS                               */}
          {/* ======================================================== */}
          {activeTab === 'billeteras' && (
            <View>
              {/* TARJETAS INSIGNIAS (MÁS MOVIMIENTO Y MÁS ESTABLE) */}
              <View style={styles.badgeRow}>
                {/* Más Movimiento */}
                <View style={[styles.badgeCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[styles.badgeIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                  </View>
                  <Text style={[styles.badgeLabel, { color: theme.textSecondary }]}>Mayor Movimiento</Text>
                  <Text style={[styles.badgeTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]} numberOfLines={1}>
                    {topVolumenWallet ? topVolumenWallet.nombre : 'N/A'}
                  </Text>
                  <Text style={[styles.badgeValue, { color: '#F59E0B', fontFamily: Fonts.bold }]}>
                    {topVolumenWallet ? formatCurrencyVE(topVolumenWallet.volumenTotal) : '0,00'} {filterMoneda}
                  </Text>
                </View>

                {/* Más Estable */}
                <View style={[styles.badgeCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[styles.badgeIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  </View>
                  <Text style={[styles.badgeLabel, { color: theme.textSecondary }]}>Billetera Más Estable</Text>
                  <Text style={[styles.badgeTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]} numberOfLines={1}>
                    {topStableWallet ? topStableWallet.nombre : 'N/A'}
                  </Text>
                  <Text style={[styles.badgeValue, { color: '#10B981', fontFamily: Fonts.bold }]}>
                    {topStableWallet ? `${topStableWallet.estabilidadScore}% Estabilidad` : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* GRÁFICO 1: VOLUMEN DE MOVIMIENTO DE DINERO */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Volumen Total de Movimiento
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
                  Suma total de dinero que circuló (Ingresos + Egresos)
                </Text>

                {barChartVolumenData.labels.length > 0 ? (
                  <>
                    <BarChart
                      data={barChartVolumenData}
                      width={screenWidth - Spacing.lg * 2 - 32}
                      height={240}
                      yAxisLabel=""
                      yAxisSuffix=""
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                        labelColor: (opacity = 1) => theme.textSecondary,
                      }}
                      verticalLabelRotation={25}
                      fromZero={true}
                      showValuesOnTopOfBars={false}
                      formatYLabel={(yValue) => formatCurrencyVE(yValue, false)}
                      style={{ borderRadius: BorderRadius.md, marginVertical: 8 }}
                    />

                    {/* Desglose de volumen por billetera */}
                    <View style={styles.legendDetails}>
                      <Text style={[styles.legendHeaderTitle, { color: theme.textSecondary, fontFamily: Fonts.bold }]}>
                        Comparativa de Billeteras ({filterMoneda}):
                      </Text>
                      {billeterasVolumen.map((b, i) => (
                        <View key={b.id || i} style={[styles.walletRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                          <View style={{ flex: 1.2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.walletRank, { color: i === 0 ? '#F59E0B' : theme.textSecondary }]}>#{i + 1}</Text>
                              <Text style={[styles.walletName, { color: theme.textPrimary, fontFamily: Fonts.bold }]} numberOfLines={1}>
                                {b.nombre}
                              </Text>
                            </View>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginLeft: 20 }}>
                              {b.transacciones} movs. • Saldo: {formatCurrencyVE(b.balance)}
                            </Text>
                          </View>

                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={{ color: '#10B981', fontSize: 11 }}>+ {formatCurrencyVE(b.ingresos)}</Text>
                            <Text style={{ color: '#EF4444', fontSize: 11 }}>- {formatCurrencyVE(b.egresos)}</Text>
                            <Text style={[styles.walletTotal, { color: '#3B82F6', fontFamily: Fonts.bold }]}>
                              Vol: {formatCurrencyVE(b.volumenTotal)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>No hay billeteras o movimientos para analizar.</Text>
                  </View>
                )}
              </View>

              {/* GRÁFICO 2: ESTABILIDAD DE BILLETERAS */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Índice de Estabilidad de Billeteras
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
                  Capacidad de conservación de saldo y menor volatilidad (%)
                </Text>

                {barChartEstabilidadData.labels.length > 0 ? (
                  <>
                    <BarChart
                      data={barChartEstabilidadData}
                      width={screenWidth - Spacing.lg * 2 - 32}
                      height={220}
                      yAxisLabel=""
                      yAxisSuffix="%"
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        labelColor: (opacity = 1) => theme.textSecondary,
                      }}
                      verticalLabelRotation={25}
                      fromZero={true}
                      showValuesOnTopOfBars={false}
                      style={{ borderRadius: BorderRadius.md, marginVertical: 8 }}
                    />

                    {/* Barras de progreso de estabilidad */}
                    <View style={styles.legendDetails}>
                      {billeterasVolumen.map((b, i) => (
                        <View key={b.id || i} style={{ marginBottom: Spacing.md }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ color: theme.textPrimary, fontFamily: Fonts.medium, fontSize: 13 }}>{b.nombre}</Text>
                            <Text style={{ color: b.estabilidadScore >= 70 ? '#10B981' : b.estabilidadScore >= 40 ? '#F59E0B' : '#EF4444', fontFamily: Fonts.bold, fontSize: 13 }}>
                              {b.estabilidadScore}%
                            </Text>
                          </View>
                          <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.max(5, b.estabilidadScore)}%`,
                                  backgroundColor: b.estabilidadScore >= 70 ? '#10B981' : b.estabilidadScore >= 40 ? '#F59E0B' : '#EF4444'
                                }
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>No hay datos suficientes para calcular estabilidad.</Text>
                  </View>
                )}
              </View>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
    borderRadius: BorderRadius.full,
  },
  headerTitle: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 13,
  },
  currencySelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  currencyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  currencyBtnText: {
    fontSize: 12,
  },
  chartWrapper: {
    marginTop: Spacing.xs,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  chartTypeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  chartTypeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  legendDetails: {
    marginTop: Spacing.md,
  },
  legendHeaderTitle: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  legendColorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendName: {
    fontSize: 13,
  },
  legendAmount: {
    fontSize: 13,
  },
  totalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 15,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  badgeCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeValue: {
    fontSize: 12,
    textAlign: 'center',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  walletRank: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    width: 20,
  },
  walletName: {
    fontSize: 14,
  },
  walletTotal: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
