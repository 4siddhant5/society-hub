import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from "react-native";
export const Button = ({ title, onPress, loading, variant = "primary", style }) => (
  <TouchableOpacity
    style={[styles.btn, variant === "outline" && styles.outline, style]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.85}
  >
    {loading ? (
      <ActivityIndicator color={variant === "outline" ? "#1a73e8" : "#fff"} />
    ) : (
      <Text style={[styles.txt, variant === "outline" && styles.outlineTxt]}>{title}</Text>
    )}
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  btn: { backgroundColor: "#1a73e8", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#1a73e8" },
  txt: { color: "#fff", fontWeight: "600", fontSize: 15 },
  outlineTxt: { color: "#1a73e8" },
});
