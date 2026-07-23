import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Pressable } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { createMovimiento, getAllBilleteras, getAllTiposMovimiento } from '../../database/database';
import { Ionicons } from '@expo/vector-icons';

export default function MovimientoRealFormView({ isDark, onBack, onSaved, userId }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [billeteras, setBilleteras] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  
  const [selectedBilletera, setSelectedBilletera] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // Para la fecha visual (DD/MM/YYYY)
  const [fechaVisual, setFechaVisual] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const bList = await getAllBilleteras(userId);
      const tList = await getAllTiposMovimiento(userId);
      setBilleteras(bList);
      setTiposMovimiento(tList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDateChange = (text) => {
    // Solo permitir números y slashes
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
    }
    setFechaVisual(formatted);
  };

  const handleSave = async () => {
    if (!selectedBilletera) return Alert.alert('Error', 'Selecciona una billetera.');
    if (!selectedTipo) return Alert.alert('Error', 'Selecciona un tipo de movimiento.');
    if (!monto.trim() || isNaN(parseFloat(monto.replace(',', '.')))) return Alert.alert('Error', 'Ingresa un monto válido.');
    if (fechaVisual.length !== 10) return Alert.alert('Error', 'Ingresa la fecha en formato DD/MM/YYYY.');

    // Parsear fecha visual a YYYY-MM-DD
    const parts = fechaVisual.split('/');
    const fechaDB = `${parts[2]}-${parts[1]}-${parts[0]}`;

    const montoNum = parseFloat(monto.replace(',', '.'));

    try {
      const result = await createMovimiento(
        userId,
        selectedBilletera,
        selectedTipo,
        montoNum,
        descripcion.trim(),
        fechaDB
      );

      if (result.success) {
        Alert.alert('Éxito', result.message);
        if (onSaved) onSaved();
        onBack();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error al guardar.');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.formHeader, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            ← Volver
          </Text>
        </TouchableOpacity>
        <Text style={[styles.formTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Registrar Movimiento
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Selección de Billetera */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Billetera
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
            {billeteras.length === 0 && <Text style={{ color: theme.textSecondary }}>No hay billeteras registradas.</Text>}
            {billeteras.map(b => {
              const isSelected = selectedBilletera === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => setSelectedBilletera(b.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F0'),
                      borderColor: isSelected ? theme.accent : theme.inputBorder,
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF' : theme.textSecondary, fontFamily: isSelected ? Fonts.bold : Fonts.regular }]}>
                    {b.nombre} ({b.moneda_abreviatura})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Selección de Tipo de Movimiento */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Tipo de Movimiento
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
            {tiposMovimiento.length === 0 && <Text style={{ color: theme.textSecondary }}>No hay tipos registrados.</Text>}
            {tiposMovimiento.map(t => {
              const isSelected = selectedTipo === t.id;
              const isIngreso = t.tipo === 'Ingreso';
              const activeColor = isIngreso ? '#10B981' : '#EF4444';

              return (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedTipo(t.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? activeColor : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F0'),
                      borderColor: isSelected ? activeColor : theme.inputBorder,
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF' : theme.textSecondary, fontFamily: isSelected ? Fonts.bold : Fonts.regular }]}>
                    {t.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Monto */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Monto
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

        {/* Fecha */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Fecha (DD/MM/AAAA)
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

        {/* Descripción */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
            Descripción (Opcional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: theme.inputBorder },
            ]}
            placeholder="Detalles del movimiento..."
            placeholderTextColor={theme.placeholder}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>Guardar Movimiento</Text>
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
  chip: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  chipText: {
    fontSize: 15,
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
