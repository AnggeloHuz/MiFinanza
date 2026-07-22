import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

export default function AdminOptionsMenu({
  visible,
  onClose,
  onLogout,
  user,
  isDark,
  modalSlide,
}) {
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.cardBackground,
              transform: [{ translateY: modalSlide }],
            },
          ]}
        >
          {/* Indicador de arrastre */}
          <View style={[styles.modalHandle, { backgroundColor: theme.inputBorder }]} />

          <View style={styles.modalHeader}>
            <View style={[styles.adminAvatarCircle, { backgroundColor: theme.accent }]}>
              <Text style={styles.adminAvatarLetter}>
                {user?.usuario ? user.usuario.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
            <View style={styles.adminMetaInfo}>
              <Text style={[styles.adminModalName, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                {user?.usuario || 'Administrador'}
              </Text>
              <Text style={[styles.adminModalRole, { color: theme.accent, fontFamily: Fonts.medium }]}>
                🛡️ Rol: {user?.rol || 'administrador'}
              </Text>
            </View>
          </View>

          <View style={[styles.modalDivider, { backgroundColor: theme.inputBorder }]} />

          <Text style={[styles.modalMenuTitle, { color: theme.textSecondary, fontFamily: Fonts.medium }]}>
            OPCIONES DISPONIBLES
          </Text>

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
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={[styles.optionText, { color: '#EF4444', fontFamily: Fonts.bold }]}>
                Cerrar Sesión
              </Text>
            </View>

          </Pressable>

          {/* BOTÓN CANCELAR */}
          <Pressable
            onPress={onClose}
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
    width: 160,
    height: 40,
    borderRadius: 18,
    display: "flex",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: "center",
    marginRight: 20,
    gap: 5,
    paddingHorizontal: 10,
    marginBottom: 20
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
});
