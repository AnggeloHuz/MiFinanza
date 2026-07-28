import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { createCobranza } from '../../database/database';

export default function CobranzaFormView({ isDark, userId, onBack, onSaved }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [entidad, setEntidad] = useState('Empresa');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('VES');
  const [fechaVisual, setFechaVisual] = useState('');

  const handleDateChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 2) clean = clean.substring(0, 2) + '/' + clean.substring(2);
    if (clean.length > 5) clean = clean.substring(0, 5) + '/' + clean.substring(5);
    setFechaVisual(clean);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Debe ingresar un nombre o descripción de la cobranza.');
      return;
    }

    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      Alert.alert('Error', 'Debe ingresar un monto mayor a cero.');
      return;
    }

    if (fechaVisual.length !== 10) {
      Alert.alert('Error', 'Ingrese una fecha válida en formato DD/MM/AAAA.');
      return;
    }

    const [d, m, y] = fechaVisual.split('/');
    if (!d || !m || !y || isNaN(d) || isNaN(m) || isNaN(y)) {
      Alert.alert('Error', 'Formato de fecha inválido.');
      return;
    }

    const response = await createCobranza(userId, entidad, nombre, fechaVisual, monto, moneda, descripcion);
    
    if (response.success) {
      Alert.alert('Éxito', response.message);
      onSaved();
    } else {
      Alert.alert('Error', response.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.formHeader, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.formTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Registrar Cobranza
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Selector de Entidad */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Tipo de Entidad
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
            {['Empresa', 'Persona', 'Banco'].map(tipo => {
              const isSelected = entidad === tipo;
              return (
                <Pressable
                  key={tipo}
                  onPress={() => setEntidad(tipo)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F0'),
                      borderColor: isSelected ? theme.accent : theme.inputBorder,
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF' : theme.textSecondary, fontFamily: isSelected ? Fonts.bold : Fonts.regular }]}>
                    {tipo}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Nombre / Descripción */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Nombre de la Entidad
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder },
            ]}
            placeholder="Ej. Juan Pérez, Empresa Y..."
            placeholderTextColor={theme.placeholder}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Descripción Adicional */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Descripción (Opcional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder, height: 80, textAlignVertical: 'top', paddingTop: Spacing.md },
            ]}
            placeholder="Detalles sobre esta cobranza..."
            placeholderTextColor={theme.placeholder}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />
        </View>

        {/* Moneda */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Moneda de la Cobranza
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
            {['VES', 'USD', 'EUR'].map(m => {
              const isSelected = moneda === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMoneda(m)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F0'),
                      borderColor: isSelected ? theme.accent : theme.inputBorder,
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF' : theme.textSecondary, fontFamily: isSelected ? Fonts.bold : Fonts.regular }]}>
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Monto */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Monto a Cobrar
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder },
            ]}
            placeholder="0.00"
            placeholderTextColor={theme.placeholder}
            keyboardType="numeric"
            value={monto}
            onChangeText={setMonto}
          />
        </View>

        {/* Fecha de Pago */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Fecha Límite (DD/MM/AAAA)
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder },
            ]}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={theme.placeholder}
            keyboardType="numeric"
            value={fechaVisual}
            onChangeText={handleDateChange}
            maxLength={10}
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#10B981' }]} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>Guardar Cobranza</Text>
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
  formTitle: {
    fontSize: 20,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  fieldContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  chipText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
