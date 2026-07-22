import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { deleteBilletera } from '../../database/database';
import { formatDateShortVE } from '../../utils/dateFormatter';
import BilleteraFormView from './BilleteraFormView';

/**
 * Vista detallada de una billetera con opciones de editar y eliminar.
 */
export default function BilleteraDetailView({ billetera, isDark, onBack, onRefresh }) {
  const theme = isDark ? Colors.dark : Colors.light;
  const [showEditForm, setShowEditForm] = useState(false);

  // Colores por moneda para el avatar
  const monedaColors = {
    VES: '#3B82F6',
    USD: '#10B981',
    EUR: '#8B5CF6',
  };

  const avatarColor = monedaColors[billetera.moneda_abreviatura] || theme.accent;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Billetera',
      `¿Estás seguro de eliminar "${billetera.nombre}"? Se borrarán todos los datos asociados a esta billetera.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteBilletera(billetera.id);
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
      <BilleteraFormView
        isDark={isDark}
        billetera={billetera}
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
          Detalles de Billetera
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll}>
        {/* Perfil / Avatar */}
        <View style={styles.profileHeader}>
          <View style={[styles.largeAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.largeAvatarText}>
              {billetera.moneda_abreviatura}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            {billetera.nombre}
          </Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
            {billetera.moneda}
          </Text>
        </View>

        {/* Información detallada */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Información General
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ID:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>#{billetera.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nombre:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{billetera.nombre}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Moneda:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {billetera.moneda} ({billetera.moneda_abreviatura})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Código:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{billetera.codigo}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha de Creación:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {billetera.created_at ? formatDateShortVE(billetera.created_at) : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={() => setShowEditForm(true)}
          >
            <Text style={styles.actionBtnText}>Editar Billetera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>Eliminar Billetera y Datos</Text>
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
  largeAvatarText: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  profileName: {
    fontSize: 24,
    marginBottom: 4,
  },
  profileRole: {
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
