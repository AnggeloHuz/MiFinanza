import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <Text className="text-white text-2xl font-bold">
        ¡Tailwind funcionando! 🚀
      </Text>
      <View className="mt-4 p-4 bg-amber-400 rounded-lg shadow-lg">
        <Text className="text-amber-900">Este es un componente con clases</Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

