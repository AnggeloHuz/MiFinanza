import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { deleteTipoMovimiento } from '../../database/database';
import { formatDateShortVE } from '../../utils/dateFormatter';
import { Ionicons } from '@expo/vector-icons';
import MovimientoFormView from './MovimientoFormView';

/**
 * Vista detallada de un tipo de movimiento con opciones de editar y eliminar.
 */
export default function MovimientoDetailView({ tipoMovimiento, isDark, onBack, onRefresh, userId }) {
  const theme = isDark ? Colors.dark : Colors.light;
  const [showEditForm, setShowEditForm] = useState(false);

  const isIngreso = tipoMovimiento.tipo === 'Ingreso';
  const tipoColor = isIngreso ? '#10B981' : '#EF4444';

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Tipo de Movimiento',
      `¿Estás seguro de eliminar "${tipoMovimiento.nombre}"? Los datos asociados no serán eliminados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTipoMovimiento(tipoMovimiento.id);
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

  // Si se está editando, mostrar el formulario reutilizable
  if (showEditForm) {
    return (
      <MovimientoFormView
        isDark={isDark}
        tipoMovimiento={tipoMovimiento}
        userId={userId}
        onBack={() => setShowEditForm(false)}
        onSaved={() => {
          setShowEditForm(false);
          if (onRefresh) onRefresh();
          onBack();
        }}
      />
    );
  }

  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <View style={[styles.detailHeader, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            ← Volver a la lista
          </Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Detalles del Movimiento
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll}>
        {/* Avatar / Perfil */}
        <View style={styles.profileHeader}>
          <View style={[styles.largeAvatar, { backgroundColor: tipoColor }]}>
            <Ionicons
              name={isIngreso ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={38}
              color="#FFF"
            />
          </View>
          <Text style={[styles.profileName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            {tipoMovimiento.nombre}
          </Text>
          <View style={[styles.tipoBadgeDetail, { backgroundColor: tipoColor + '20', borderColor: tipoColor }]}>
            <Text style={[styles.tipoBadgeDetailText, { color: tipoColor, fontFamily: Fonts.medium }]}>
              {tipoMovimiento.tipo}
            </Text>
          </View>
        </View>

        {/* Información detallada */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Información General
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ID:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>#{tipoMovimiento.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nombre:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{tipoMovimiento.nombre}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Tipo:</Text>
            <Text style={[styles.infoValue, { color: tipoColor, fontWeight: 'bold' }]}>{tipoMovimiento.tipo}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha de Creación:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {tipoMovimiento.created_at ? formatDateShortVE(tipoMovimiento.created_at) : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={() => setShowEditForm(true)}
          >
            <Text style={styles.actionBtnText}>Editar Tipo de Movimiento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>Eliminar Tipo de Movimiento</Text>
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
    fontSize: 24,
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
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
