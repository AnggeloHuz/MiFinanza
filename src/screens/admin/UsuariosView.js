import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import UserDetailView from './UserDetailView';
import { Ionicons } from '@expo/vector-icons';

export default function UsuariosView({ usersList, isDark, onRefresh }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUserPress = (user) => {
    setSelectedUser(user);
  };

  const handleBackPress = () => {
    setSelectedUser(null);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const lowerQuery = searchQuery.toLowerCase();
    return usersList.filter(
      (u) =>
        u.usuario.toLowerCase().includes(lowerQuery) ||
        u.id.toString().includes(lowerQuery)
    );
  }, [searchQuery, usersList]);

  // VISTA DE DETALLES DEL USUARIO (STACK STYLE)
  if (selectedUser) {
    return (
      <UserDetailView 
        user={selectedUser}
        isDark={isDark}
        onBack={handleBackPress}
        onRefresh={onRefresh}
      />
    );
  }

  // VISTA DE LISTA DE USUARIOS
  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Buscar por usuario o ID..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
            Lista de Usuarios
          </Text>
          <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.countBadgeText}>{filteredUsers.length}</Text>
          </View>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No se encontraron usuarios.</Text>
          </View>
        ) : (
          filteredUsers.map((item) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleUserPress(item)}
              key={item.id.toString()}
              style={[
                styles.userCard,
                {
                  backgroundColor: theme.cardBackground,
                  shadowColor: theme.cardShadow,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                },
              ]}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.usuario ? item.usuario.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={[styles.userNameText, { color: theme.textPrimary, fontFamily: Fonts.bold }]}>
                  {item.usuario}
                </Text>
                <Text style={[styles.userDateText, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>
                  ID #{item.id} • Registrado
                </Text>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      item.rol === 'administrador'
                        ? isDark
                          ? 'rgba(26, 171, 138, 0.2)'
                          : 'rgba(26, 171, 138, 0.15)'
                        : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                    borderColor: item.rol === 'administrador' ? theme.accent : theme.inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color: item.rol === 'administrador' ? theme.accent : theme.textSecondary,
                      fontFamily: Fonts.medium,
                    },
                  ]}
                >
                  {item.rol === 'administrador' ? '🛡️ Admin' : '👤 Usuario'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  scrollPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1AAB8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 16,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  userDateText: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 12,
  },
});
