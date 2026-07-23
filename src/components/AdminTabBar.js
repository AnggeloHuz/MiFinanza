import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'show-chart', type: 'material' },
  { id: 'billeteras', label: 'Billeteras', icon: 'account-balance', type: 'material' },
  { id: 'movimientos', label: 'Movimientos', icon: 'hand-holding-usd', type: 'font-awesome-5' },
  { id: 'opciones', label: 'Opciones', icon: 'grid-view', type: 'material' },
];

export default function AdminTabBar({ activeTab, onSelectTab, isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const renderTabIcon = (tab, isSelected) => {
    const iconColor = isSelected ? theme.accent : theme.textSecondary;
    const iconSize = 22;

    if (tab.type === 'material') {
      return <MaterialIcons name={tab.icon} size={iconSize} color={iconColor} />;
    } else if (tab.type === 'font-awesome-5') {
      return <FontAwesome5 name={tab.icon} size={20} color={iconColor} />;
    }
    return <Ionicons name="apps" size={iconSize} color={iconColor} />;
  };

  return (
    <View
      style={[
        styles.bottomTabBar,
        {
          backgroundColor: theme.cardBackground,
          shadowColor: theme.cardShadow,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelectTab(tab.id)}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              {renderTabIcon(tab, isSelected)}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isSelected ? theme.accent : theme.textSecondary,
                  fontFamily: isSelected ? Fonts.bold : Fonts.regular,
                },
              ]}
            >
              {tab.label}
            </Text>
            {isSelected && <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    elevation: 16,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    paddingHorizontal: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  iconContainer: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
