import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { deleteMovimiento } from '../../database/database';
import { formatDateShortVE } from '../../utils/dateFormatter';
import { formatCurrencyVE } from '../../utils/currencyFormatter';
import { Ionicons } from '@expo/vector-icons';

export default function MovimientoRealDetailView({ movimiento, isDark, onBack, onRefresh, userId }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const isIngreso = movimiento.categoria === 'Ingreso';
  const tipoColor = isIngreso ? '#10B981' : '#EF4444';

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Movimiento',
      `¿Estás seguro de eliminar este movimiento por ${formatCurrencyVE(movimiento.monto)} ${movimiento.moneda}? Se restaurará el balance de la billetera.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMovimiento(movimiento.id, userId);
            if (result.success) {
              Alert.alert('Éxito', result.message);
              onBack();
              if (onRefresh) onRefresh();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  // Convertir fecha YYYY-MM-DD a objeto Date o formatearla
  const dateParts = movimiento.fecha.split('-');
  const formattedDate = dateParts.length === 3 
    ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
    : movimiento.fecha;

  return (
    <View style={styles.detailContainer}>
      <View style={[styles.detailHeader, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            ← Volver al historial
          </Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Detalles del Movimiento
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll}>
        <View style={styles.profileHeader}>
          <View style={[styles.largeAvatar, { backgroundColor: tipoColor }]}>
            <Ionicons
              name={isIngreso ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={38}
              color="#FFF"
            />
          </View>
          <Text style={[styles.profileName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            {formatCurrencyVE(movimiento.monto)} {movimiento.moneda}
          </Text>
          <View style={[styles.tipoBadgeDetail, { backgroundColor: tipoColor + '20', borderColor: tipoColor }]}>
            <Text style={[styles.tipoBadgeDetailText, { color: tipoColor, fontFamily: Fonts.medium }]}>
              {movimiento.tipo_nombre}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Información General
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{formattedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Billetera:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{movimiento.billetera_nombre}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Categoría (Tipo):</Text>
            <Text style={[styles.infoValue, { color: tipoColor, fontWeight: 'bold' }]}>{movimiento.categoria}</Text>
          </View>

          {movimiento.descripcion ? (
            <View style={styles.infoRowColumn}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Descripción:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{movimiento.descripcion}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Registrado el:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {movimiento.created_at ? formatDateShortVE(movimiento.created_at) : 'No disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>Eliminar Movimiento</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
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
  backBtnText: {
    fontSize: 15,
  },
  detailTitle: {
    fontSize: 18,
    flex: 1,
  },
  detailScroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  profileName: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  tipoBadgeDetail: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tipoBadgeDetailText: {
    fontSize: 14,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  infoRowColumn: {
    flexDirection: 'column',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteBtnText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
