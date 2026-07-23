import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Pressable } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { createBilletera, updateBilletera } from '../../database/database';
import { Ionicons } from '@expo/vector-icons';

// Opciones de moneda disponibles
const MONEDAS = [
  { nombre: 'Bolívares Venezolanos', abreviatura: 'VES' },
  { nombre: 'Dólares Estadounidenses', abreviatura: 'USD' },
  { nombre: 'Euros', abreviatura: 'EUR' },
];

/**
 * Formulario reutilizable para Agregar o Editar una billetera.
 * Si se pasa `billetera`, entra en modo edición. Si no, modo creación.
 */
export default function BilleteraFormView({ isDark, billetera, onBack, onSaved, userId }) {
  const theme = isDark ? Colors.dark : Colors.light;
  const isEditing = !!billetera;

  const [nombre, setNombre] = useState('');
  const [monedaIndex, setMonedaIndex] = useState(0);
  const [codigo, setCodigo] = useState('');
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    if (billetera) {
      setNombre(billetera.nombre);
      setCodigo(billetera.codigo === 'Sin código' ? '' : billetera.codigo);
      setBalance(billetera.balance ? billetera.balance.toString() : '0.00');
      const idx = MONEDAS.findIndex((m) => m.abreviatura === billetera.moneda_abreviatura);
      setMonedaIndex(idx >= 0 ? idx : 0);
    }
  }, [billetera]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la billetera es obligatorio.');
      return;
    }

    const monedaSeleccionada = MONEDAS[monedaIndex];
    const codigoFinal = codigo.trim() || 'Sin código';
    const balanceNum = parseFloat(balance.replace(',', '.')) || 0.00;

    try {
      let result;
      if (isEditing) {
        result = await updateBilletera(
          billetera.id,
          nombre.trim(),
          monedaSeleccionada.nombre,
          monedaSeleccionada.abreviatura,
          codigoFinal,
          balanceNum
        );
      } else {
        result = await createBilletera(
          userId,
          nombre.trim(),
          monedaSeleccionada.nombre,
          monedaSeleccionada.abreviatura,
          codigoFinal,
          balanceNum
        );
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
      console.error('[BilleteraForm]', e);
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
          {isEditing ? 'Editar Billetera' : 'Nueva Billetera'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            placeholder="Ej: Banco de Venezuela, Binance, PayPal..."
            placeholderTextColor={theme.placeholder}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Moneda — Selector visual */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Moneda
          </Text>
          <View style={styles.monedaOptions}>
            {MONEDAS.map((m, idx) => {
              const isSelected = idx === monedaIndex;
              return (
                <Pressable
                  key={m.abreviatura}
                  onPress={() => setMonedaIndex(idx)}
                  style={[
                    styles.monedaChip,
                    {
                      backgroundColor: isSelected
                        ? theme.accent
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F0F0F0',
                      borderColor: isSelected ? theme.accent : theme.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.monedaChipText,
                      {
                        color: isSelected ? '#FFF' : theme.textSecondary,
                        fontFamily: isSelected ? Fonts.bold : Fonts.regular,
                      },
                    ]}
                  >
                    {m.abreviatura}
                  </Text>
                  <Text
                    style={[
                      styles.monedaChipSubtext,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary },
                    ]}
                  >
                    {m.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Código bancario */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Código Bancario
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
            placeholder="Ej: 0102 (dejar vacío si no aplica)"
            placeholderTextColor={theme.placeholder}
            value={codigo}
            onChangeText={setCodigo}
          />
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Si la billetera no es un banco, se guardará como "Sin código".
          </Text>
        </View>

        {/* Balance */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Balance Actual / Inicial
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
            placeholder="0.00"
            placeholderTextColor={theme.placeholder}
            keyboardType="numeric"
            value={balance}
            onChangeText={setBalance}
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          onPress={handleSave}
        >
          <Ionicons name={isEditing ? 'create-outline' : 'add-circle-outline'} size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Guardar Cambios' : 'Agregar Billetera'}
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
  helperText: {
    fontSize: 12,
    marginTop: Spacing.xs + 2,
    lineHeight: 16,
  },
  monedaOptions: {
    gap: Spacing.sm,
  },
  monedaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  monedaChipText: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  monedaChipSubtext: {
    fontSize: 13,
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
