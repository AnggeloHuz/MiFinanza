import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { deleteUser, updateUserPassword } from '../../database/database';
import { formatDateShortVE } from '../../utils/dateFormatter';

export default function UserDetailView({ user, isDark, onBack, onRefresh }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleDeleteUser = () => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de eliminar a ${user.usuario}? Esta acción no se puede deshacer y borrará toda su información.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteUser(user.id);
            if (result.success) {
              Alert.alert('Éxito', result.message);
              onBack();
              if (onRefresh) onRefresh();
            } else {
              Alert.alert('Error', result.message);
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const result = await updateUserPassword(user.id, newPassword);
    if (result.success) {
      Alert.alert('Éxito', result.message);
      setShowPasswordModal(false);
      setNewPassword('');
    } else {
      Alert.alert('Error', 'Hubo un problema actualizando la contraseña.');
    }
  };

  return (
    <View style={styles.detailContainer}>
      <View style={[styles.detailHeader, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.accent, fontFamily: Fonts.medium }]}>
            ← Volver a la lista
          </Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
          Detalles del Usuario
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll}>
        <View style={styles.profileHeader}>
          <View style={[styles.largeAvatar, { backgroundColor: theme.accent }]}>
            <Text style={styles.largeAvatarText}>
              {user.usuario ? user.usuario.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            {user.usuario}
          </Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
            Rol: {user.rol === 'administrador' ? 'Administrador' : 'Usuario Regular'}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: Fonts.medium }]}>Información General</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ID de Usuario:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>#{user.id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nombre de Usuario:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{user.usuario}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha de Registro:</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {user.created_at ? formatDateShortVE(user.created_at) : 'No disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.actionBtnText}>Cambiar Contraseña</Text>
          </TouchableOpacity>

          {user.rol !== 'administrador' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={handleDeleteUser}
            >
              <Text style={styles.deleteBtnText}>Eliminar Usuario y Datos</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal Cambio de Contraseña */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
              Nueva Contraseña
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
              Ingresa la nueva contraseña para el usuario {user.usuario}.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { 
                  color: theme.textPrimary,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5',
                  borderColor: theme.inputBorder 
                }
              ]}
              placeholder="Contraseña (min. 6 caracteres)"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
              >
                <Text style={[styles.modalBtnText, { color: theme.textPrimary }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                onPress={handleChangePassword}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    shadowColor: '#1AAB8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  largeAvatarText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
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
  
  // ESTILOS DE MODAL
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.sm,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  }
});
