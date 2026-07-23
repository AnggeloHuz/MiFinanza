import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { getAllBilleteras, getAllTiposMovimiento, updateUserPassword } from '../database/database';
import { Colors } from '../constants/theme';

// Componentes modulares
import AdminHeader from '../components/AdminHeader';
import AdminTabBar from '../components/AdminTabBar';
import AdminOptionsMenu from '../components/AdminOptionsMenu';

// Vistas
import DashboardView from './admin/DashboardView';
import BilleterasView from './admin/BilleterasView';
import MovimientosView from './admin/MovimientosView';

export default function MainScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, logout } = useAuth();

  // Pestaña activa (ahora inicia en dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [billeterasList, setBilleterasList] = useState([]);
  const [tiposMovimientoList, setTiposMovimientoList] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Params para navegación cruzada
  const [movimientosInitialView, setMovimientosInitialView] = useState('menu');
  const [movimientosFilter, setMovimientosFilter] = useState('');

  // Animaciones de transición
  const contentFade = useRef(new Animated.Value(1)).current;
  const contentSlide = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (user?.id) {
      fetchBilleteras();
      fetchTiposMovimiento();
    }
  }, [user?.id]);

  const fetchBilleteras = async () => {
    try {
      const data = await getAllBilleteras(user.id);
      setBilleterasList(data);
    } catch (e) {
      console.error('Error al cargar billeteras:', e);
    }
  };

  const fetchTiposMovimiento = async () => {
    try {
      const data = await getAllTiposMovimiento(user.id);
      setTiposMovimientoList(data);
    } catch (e) {
      console.error('Error al cargar tipos de movimiento:', e);
    }
  };

  const changeTab = (tabId, params = {}) => {
    if (tabId === 'opciones') {
      openOptionsModal();
      return;
    }

    if (tabId === 'movimientos') {
      setMovimientosInitialView(params.initialView || 'menu');
      setMovimientosFilter(params.filter || '');
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

  const handleChangePassword = async (newPassword) => {
    try {
      const result = await updateUserPassword(user.id, newPassword);
      return result;
    } catch (e) {
      console.error('Error al cambiar contraseña:', e);
      return { success: false, message: 'Error inesperado.' };
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'billeteras':
        return 'Billeteras';
      case 'movimientos':
        return 'Movimientos';
      default:
        return 'Dashboard';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />

      {/* HEADER */}
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
        {activeTab === 'dashboard' && (
          <DashboardView isDark={isDark} user={user} />
        )}
        {activeTab === 'billeteras' && (
          <BilleterasView 
            isDark={isDark} 
            billeterasList={billeterasList} 
            onRefresh={fetchBilleteras} 
            userId={user?.id} 
            onGoToHistory={(walletName) => changeTab('movimientos', { initialView: 'historial', filter: walletName })}
          />
        )}
        {activeTab === 'movimientos' && (
          <MovimientosView 
            isDark={isDark} 
            tiposMovimientoList={tiposMovimientoList} 
            onRefresh={fetchTiposMovimiento} 
            userId={user?.id} 
            initialView={movimientosInitialView}
            initialFilter={movimientosFilter}
          />
        )}
      </Animated.View>

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      <AdminTabBar
        activeTab={activeTab}
        onSelectTab={changeTab}
        isDark={isDark}
      />

      {/* MENÚ MODAL DE OPCIONES */}
      <AdminOptionsMenu
        visible={showOptionsModal}
        onClose={closeOptionsModal}
        onLogout={handleLogout}
        onChangePassword={handleChangePassword}
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
