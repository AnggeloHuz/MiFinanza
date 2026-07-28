import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import { deleteCobranza } from '../../database/database';
import CobranzaPaymentFormView from './CobranzaPaymentFormView';

const ENTIDAD_ICONS = {
  Empresa: 'business-outline',
  Persona: 'person-outline',
  Banco: 'business-outline',
};

export default function CobranzaDetailView({ isDark, userId, cobranza, onBack, onRefresh }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const isCobrado = cobranza.estatus === 'cobrado';
  const iconName = ENTIDAD_ICONS[cobranza.entidad] || 'business-outline';

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cobranza',
      isCobrado 
        ? 'Esta cobranza ya está cobrada. Al eliminarla, el dinero será restado del balance de la billetera en donde se recibió. ¿Estás seguro?' 
        : '¿Estás seguro de que deseas eliminar esta cuenta por cobrar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const res = await deleteCobranza(cobranza.id, userId);
            if (res.success) {
              Alert.alert('Éxito', res.message);
              onRefresh();
              onBack();
            } else {
              Alert.alert('Error', res.message);
            }
          }
        }
      ]
    );
  };

  if (showPaymentForm) {
    return (
      <CobranzaPaymentFormView 
        isDark={isDark} 
        userId={userId} 
        cobranza={cobranza} 
        onBack={() => setShowPaymentForm(false)} 
        onSaved={() => {
          setShowPaymentForm(false);
          onRefresh();
          onBack(); 
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Detalles de Cobranza
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TARJETA PRINCIPAL */}
        <View style={[styles.mainCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name={iconName} size={32} color={theme.textPrimary} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.title, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                {cobranza.nombre}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {cobranza.entidad}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isCobrado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.statusText, { color: isCobrado ? '#10B981' : '#EF4444', fontFamily: Fonts.bold }]}>
                {isCobrado ? 'COBRADO' : 'SIN COBRAR'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />

          {/* INFORMACIÓN */}
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Monto a Recibir</Text>
              <Text style={[styles.infoValue, { color: '#10B981', fontFamily: Fonts.bold, fontSize: 20 }]}>
                {formatCurrencyVE(cobranza.monto)} {cobranza.moneda}
              </Text>
            </View>
            <View style={[styles.infoBlock, { alignItems: 'flex-end' }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha Límite</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
                {cobranza.fecha_cobro}
              </Text>
            </View>
          </View>

          {cobranza.descripcion ? (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Descripción</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary, fontFamily: Fonts.regular, fontSize: 14 }]}>
                {cobranza.descripcion}
              </Text>
            </View>
          ) : null}
          
          <View style={{ marginTop: Spacing.md }}>
             <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha de Creación</Text>
             <Text style={[styles.infoValue, { color: theme.textPrimary, fontFamily: Fonts.medium, fontSize: 13 }]}>
                {cobranza.created_at}
             </Text>
          </View>

        </View>

        {/* ACCIONES */}
        <View style={styles.actionsContainer}>
          {!isCobrado && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#10B981', marginBottom: Spacing.md }]}
              onPress={() => setShowPaymentForm(true)}
            >
              <Ionicons name="wallet-outline" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Registrar Cobro</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Eliminar Cobranza</Text>
          </TouchableOpacity>
        </View>

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
  mainCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.md,
    opacity: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
