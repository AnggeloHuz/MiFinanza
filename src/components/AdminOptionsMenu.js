import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Platform, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

export default function AdminOptionsMenu({
  visible,
  onClose,
  onLogout,
  onChangePassword,
  user,
  isDark,
  modalSlide,
}) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordSubmit = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (onChangePassword) {
      const result = await onChangePassword(newPassword);
      if (result.success) {
        Alert.alert('Éxito', result.message);
        setIsChangingPassword(false);
        setNewPassword('');
        onClose(); // Cerrar el menú principal
      } else {
        Alert.alert('Error', result.message || 'Error al cambiar contraseña');
      }
    }
  };

  const handleClose = () => {
    setIsChangingPassword(false);
    setNewPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.cardBackground,
              transform: [{ translateY: modalSlide }],
            },
          ]}
          onStartShouldSetResponder={() => true} // Evitar que el press en el modal cierre el overlay
        >
          {/* Indicador de arrastre */}
          <View style={[styles.modalHandle, { backgroundColor: theme.inputBorder }]} />

          {!isChangingPassword ? (
            <>
              {/* VISTA PRINCIPAL DEL MENÚ */}
              <View style={styles.modalHeader}>
                <View style={[styles.adminAvatarCircle, { backgroundColor: theme.accent }]}>
                  <Text style={styles.adminAvatarLetter}>
                    {user?.usuario ? user.usuario.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={styles.adminMetaInfo}>
                  <Text style={[styles.adminModalName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                    {user?.usuario || 'Usuario'}
                  </Text>
                  <Text style={[styles.adminModalRole, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
                    Gestión de cuenta
                  </Text>
                </View>
              </View>

              <View style={[styles.modalDivider, { backgroundColor: theme.inputBorder }]} />

              <Text style={[styles.modalMenuTitle, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
                OPCIONES DISPONIBLES
              </Text>

              {/* BOTÓN CAMBIAR CONTRASEÑA */}
              <Pressable
                onPress={() => setIsChangingPassword(true)}
                style={({ pressed }) => [
                  styles.optionItem,
                  {
                    backgroundColor: pressed
                      ? isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)'
                      : 'transparent',
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <View style={[styles.optionIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
                  <Ionicons name="key-outline" size={20} color={theme.textPrimary} />
                  <Text style={[styles.optionText, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
                    Cambiar Contraseña
                  </Text>
                </View>
              </Pressable>

              {/* BOTÓN CERRAR SESIÓN */}
              <Pressable
                onPress={onLogout}
                style={({ pressed }) => [
                  styles.optionItem,
                  {
                    backgroundColor: pressed
                      ? isDark
                        ? '#3D1C24'
                        : '#FEE2E2'
                      : isDark
                        ? '#2A1520'
                        : '#FDE8E8',
                    borderColor: isDark ? '#8B3A3A' : '#FCA5A5',
                  },
                ]}
              >
                <View style={[styles.optionIconBox, { backgroundColor: isDark ? '#4A1D24' : '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  <Text style={[styles.optionText, { color: '#EF4444', fontFamily: Fonts.bold }]}>
                    Cerrar Sesión
                  </Text>
                </View>
              </Pressable>

              {/* BOTÓN CANCELAR */}
              <Pressable
                onPress={handleClose}
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.cancelText, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>
                  Cancelar
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* VISTA DE CAMBIO DE CONTRASEÑA */}
              <View style={styles.passwordHeader}>
                <TouchableOpacity onPress={() => setIsChangingPassword(false)} style={styles.passwordBackBtn}>
                  <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.passwordTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                  Nueva Contraseña
                </Text>
              </View>

              <Text style={[styles.passwordSubtitle, { color: theme.textSecondary }]}>
                Ingresa una nueva contraseña para tu cuenta. Mínimo 6 caracteres.
              </Text>

              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Nueva Contraseña"
                placeholderTextColor={theme.placeholder}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <TouchableOpacity
                style={[styles.savePasswordBtn, { backgroundColor: theme.accent }]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.savePasswordText, { fontFamily: Fonts.bold }]}>Actualizar Contraseña</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  adminAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  adminAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  adminMetaInfo: {
    flex: 1,
  },
  adminModalName: {
    fontSize: 18,
    textTransform: 'capitalize',
  },
  adminModalRole: {
    fontSize: 13,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    opacity: 0.2,
    marginBottom: Spacing.md,
  },
  modalMenuTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  optionIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: 12,
    display: "flex"
  },
  optionText: {
    fontSize: 15,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 15,
  },

  // Estilos Cambio de contraseña
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  passwordBackBtn: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  passwordTitle: {
    fontSize: 20,
  },
  passwordSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  savePasswordBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  savePasswordText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
