import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Pressable } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { createTipoMovimiento, updateTipoMovimiento } from '../../database/database';
import { Ionicons } from '@expo/vector-icons';

const TIPOS = ['Ingreso', 'Egreso'];

/**
 * Formulario reutilizable para Agregar o Editar un tipo de movimiento.
 * Si se pasa `tipoMovimiento`, entra en modo edición. Si no, modo creación.
 */
export default function MovimientoFormView({ isDark, tipoMovimiento, onBack, onSaved }) {
  const theme = isDark ? Colors.dark : Colors.light;
  const isEditing = !!tipoMovimiento;

  const [tipoSeleccionado, setTipoSeleccionado] = useState('Ingreso');
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (tipoMovimiento) {
      setTipoSeleccionado(tipoMovimiento.tipo);
      setNombre(tipoMovimiento.nombre);
    }
  }, [tipoMovimiento]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del tipo de movimiento es obligatorio.');
      return;
    }

    try {
      let result;
      if (isEditing) {
        result = await updateTipoMovimiento(tipoMovimiento.id, tipoSeleccionado, nombre.trim());
      } else {
        result = await createTipoMovimiento(tipoSeleccionado, nombre.trim());
      }

      if (result.success) {
        Alert.alert('Éxito', result.message);
        if (onSaved) onSaved();
        onBack();
      } else {
        Alert.alert('Error', result.message || 'No se pudo guardar.');
      }
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
      console.error('[MovimientoForm]', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.formHeader, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            ← Volver
          </Text>
        </TouchableOpacity>
        <Text style={[styles.formTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          {isEditing ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Tipo — Selector visual */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Tipo
          </Text>
          <View style={styles.tipoOptions}>
            {TIPOS.map((t) => {
              const isSelected = t === tipoSeleccionado;
              const isIngreso = t === 'Ingreso';
              const activeColor = isIngreso ? '#10B981' : '#EF4444';
              return (
                <Pressable
                  key={t}
                  onPress={() => setTipoSeleccionado(t)}
                  style={[
                    styles.tipoChip,
                    {
                      backgroundColor: isSelected
                        ? activeColor
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F0F0F0',
                      borderColor: isSelected ? activeColor : theme.inputBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={isIngreso ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={22}
                    color={isSelected ? '#FFF' : theme.textSecondary}
                    style={{ marginRight: Spacing.sm }}
                  />
                  <Text
                    style={[
                      styles.tipoChipText,
                      {
                        color: isSelected ? '#FFF' : theme.textSecondary,
                        fontFamily: isSelected ? Fonts.bold : Fonts.regular,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Nombre */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Nombre
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.textPrimary,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
                borderColor: theme.inputBorder,
              },
            ]}
            placeholder="Ej: Salario, Alquiler, Venta, Compra..."
            placeholderTextColor={theme.placeholder}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          onPress={handleSave}
        >
          <Ionicons name={isEditing ? 'create-outline' : 'add-circle-outline'} size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Guardar Cambios' : 'Agregar Tipo de Movimiento'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formHeader: {
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
  formTitle: {
    fontSize: 18,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 15,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  tipoOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tipoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tipoChipText: {
    fontSize: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
