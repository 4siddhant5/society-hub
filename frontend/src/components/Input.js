import {
  TextInput,
  View,
  Text,
  StyleSheet
} from "react-native";
export const Input = ({ label, error, ...props }) => (
  <View style={styles.wrap}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error && styles.inputErr]}
      placeholderTextColor="#9aa0a6"
      {...props}
    />
    {error && <Text style={styles.err}>{error}</Text>}
  </View>
);
const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, color: "#5f6368", marginBottom: 5, fontWeight: "500" },
  input: {
    borderWidth: 1, borderColor: "#dadce0", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#202124", backgroundColor: "#fff",
  },
  inputErr: { borderColor: "#d93025" },
  err: { color: "#d93025", fontSize: 12, marginTop: 4 },
});
