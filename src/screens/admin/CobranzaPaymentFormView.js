import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import { getAllBilleteras, collectCobranza } from '../../database/database';

export default function CobranzaPaymentFormView({ isDark, userId, cobranza, onBack, onSaved }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [billeteras, setBilleteras] = useState([]);
  const [selectedBilleteraId, setSelectedBilleteraId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBilleteras();
  }, []);

  const fetchBilleteras = async () => {
    try {
      const data = await getAllBilleteras(userId);
      setBilleteras(data);
    } catch (error) {
      console.error('Error al cargar billeteras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedBilleteraId) {
      Alert.alert('Error', 'Debes seleccionar una billetera en la cual recibir el dinero.');
      return;
    }

    const billeteraSeleccionada = billeteras.find(b => b.id === selectedBilleteraId);
    if (!billeteraSeleccionada) return;

    Alert.alert(
      'Confirmar Cobro',
      `¿Estás seguro de que deseas registrar el cobro de ${formatCurrencyVE(cobranza.monto)} ${cobranza.moneda} en la billetera "${billeteraSeleccionada.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setProcessing(true);
            const res = await collectCobranza(cobranza.id, selectedBilleteraId, userId);
            setProcessing(false);

            if (res.success) {
              Alert.alert('Cobro Exitoso', res.message);
              onSaved();
            } else {
              Alert.alert('Error', res.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Registrar Cobro
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Info del crédito a cobrar */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: theme.inputBorder }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Entidad que Paga</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>{cobranza.nombre}</Text>
          
          <View style={styles.divider} />
          
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Monto a Recibir</Text>
          <Text style={[styles.summaryAmount, { color: '#10B981', fontFamily: Fonts.bold }]}>
            +{formatCurrencyVE(cobranza.monto)} {cobranza.moneda}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
          Selecciona una Billetera Destino
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20 }} />
        ) : (
          (() => {
            const filteredBilleteras = billeteras.filter(b => b.moneda_abreviatura === cobranza.moneda);
            if (filteredBilleteras.length === 0) {
              return (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>
                  No tienes billeteras en {cobranza.moneda} para recibir este pago.
                </Text>
              );
            }
            return filteredBilleteras.map(b => {
              const isSelected = selectedBilleteraId === b.id;

              return (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedBilleteraId(b.id)}
                  style={[
                    styles.walletCard,
                    { backgroundColor: theme.cardBackground, borderColor: isSelected ? '#10B981' : theme.inputBorder }
                  ]}
                >
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                      {b.nombre}
                    </Text>
                    <Text style={[styles.walletBalance, { color: theme.textSecondary }]}>
                      Balance actual: {formatCurrencyVE(b.balance)} {b.moneda_abreviatura}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.radioCircle,
                    { borderColor: isSelected ? '#10B981' : theme.textSecondary }
                  ]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: '#10B981' }]} />}
                  </View>
                </TouchableOpacity>
              );
            });
          })()
        )}

        <TouchableOpacity 
          style={[
            styles.payBtn, 
            { backgroundColor: selectedBilleteraId && !processing ? '#10B981' : theme.textSecondary }
          ]}
          onPress={handlePay}
          disabled={!selectedBilleteraId || processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.payBtnText}>Confirmar Cobro</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    marginVertical: Spacing.md,
  },
  summaryAmount: {
    fontSize: 28,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 13,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
