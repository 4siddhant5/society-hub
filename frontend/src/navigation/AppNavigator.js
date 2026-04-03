import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import ComplaintsScreen from "../screens/ComplaintsScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import ProfileScreen from "../screens/ProfileScreen";


const TABS = [
  { key: "home", label: "Home", icon: "⌂" },
  { key: "complaints", label: "Issues", icon: "⚑" },
  { key: "payments", label: "Pay", icon: "₹" },
  { key: "profile", label: "Profile", icon: "○" },
];

export default function AppNavigator({ user, onLogout }) {
  const [tab, setTab] = useState("home");


  const Screen = {
    home: <HomeScreen user={user} />,
    complaints: <ComplaintsScreen user={user} />,
    payments: <PaymentsScreen user={user} />,
    profile: <ProfileScreen user={user} onLogout={onLogout} />,
  }[tab];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{Screen}</View>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.icon, tab === t.key && styles.active]}>{t.icon}</Text>
            <Text style={[styles.label, tab === t.key && styles.active]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { flex: 1 },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#dadce0", paddingBottom: 8 },
  tab: { flex: 1, alignItems: "center", paddingTop: 10, gap: 2 },
  icon: { fontSize: 18, color: "#9aa0a6" },
  label: { fontSize: 10, color: "#9aa0a6" },
  active: { color: "#1a73e8" },
});
