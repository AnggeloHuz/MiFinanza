import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAllBilleteras } from '../database/database';
import { Colors } from '../constants/theme';

// Componentes modulares
import AdminHeader from '../components/AdminHeader';
import AdminTabBar from '../components/AdminTabBar';
import AdminOptionsMenu from '../components/AdminOptionsMenu';

// Vistas individuales del Administrador
import UsuariosView from './admin/UsuariosView';
import BilleterasView from './admin/BilleterasView';
import MovimientosView from './admin/MovimientosView';

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, logout } = useAuth();

  // Pestaña activa
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usersList, setUsersList] = useState([]);
  const [billeterasList, setBilleterasList] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Animaciones de transición
  const contentFade = useRef(new Animated.Value(1)).current;
  const contentSlide = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    fetchUsers();
    fetchBilleteras();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsersList(data);
    } catch (e) {
      console.error('Error al cargar usuarios:', e);
    }
  };

  const fetchBilleteras = async () => {
    try {
      const data = await getAllBilleteras();
      setBilleterasList(data);
    } catch (e) {
      console.error('Error al cargar billeteras:', e);
    }
  };

  const changeTab = (tabId) => {
    if (tabId === 'opciones') {
      openOptionsModal();
      return;
    }

    if (tabId === activeTab) return;

    // Transición suave entre vistas
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 15,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tabId);
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlide, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const openOptionsModal = () => {
    setShowOptionsModal(true);
    Animated.spring(modalSlide, {
      toValue: 0,
      tension: 65,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const closeOptionsModal = () => {
    Animated.timing(modalSlide, {
      toValue: 300,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowOptionsModal(false);
    });
  };

  const handleLogout = () => {
    closeOptionsModal();
    setTimeout(() => {
      logout();
    }, 200);
  };

  const handleBackPress = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas salir del panel de administración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'usuarios':
        return 'Usuarios';
      case 'billeteras':
        return 'Billeteras';
      case 'movimientos':
        return 'Movimientos';
      default:
        return 'Usuarios';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />

      {/* HEADER Y BANNER DE TÍTULO DE SECCIÓN */}
      <AdminHeader
        title={getTabTitle()}
        onBackPress={handleBackPress}
        isDark={isDark}
      />

      {/* CONTENIDO PRINCIPAL POR VISTA */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
          },
        ]}
      >
        {activeTab === 'usuarios' && (
          <UsuariosView usersList={usersList} isDark={isDark} onRefresh={fetchUsers} />
        )}
        {activeTab === 'billeteras' && (
          <BilleterasView isDark={isDark} billeterasList={billeterasList} onRefresh={fetchBilleteras} />
        )}
        {activeTab === 'movimientos' && (
          <MovimientosView isDark={isDark} />
        )}
      </Animated.View>

      {/* BARRA DE NAVEGACIÓN INFERIOR TABS (COMPONENTE APARTADO) */}
      <AdminTabBar
        activeTab={activeTab}
        onSelectTab={changeTab}
        isDark={isDark}
      />

      {/* MENÚ MODAL DE OPCIONES DE ADMINISTRADOR */}
      <AdminOptionsMenu
        visible={showOptionsModal}
        onClose={closeOptionsModal}
        onLogout={handleLogout}
        user={user}
        isDark={isDark}
        modalSlide={modalSlide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
});
