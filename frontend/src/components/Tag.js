import {
  View,
  Text,
  StyleSheet
} from "react-native";
const colors = {
  open: "#e8f0fe", in_progress: "#fef3cd", resolved: "#e6f4ea", closed: "#f1f3f4",
  high: "#fde7e7", medium: "#fff3e0", low: "#e6f4ea",
  emergency: "#fde7e7", general: "#e8f0fe", maintenance: "#fef3cd", event: "#e6f4ea",
};
const text = {
  open: "#1a73e8", in_progress: "#f29900", resolved: "#1e8e3e", closed: "#5f6368",
  high: "#d93025", medium: "#f29900", low: "#1e8e3e",
  emergency: "#d93025", general: "#1a73e8", maintenance: "#f29900", event: "#1e8e3e",
};
export const Tag = ({ label }) => (
  <View style={[styles.tag, { backgroundColor: colors[label] || "#f1f3f4" }]}>
    <Text style={[styles.txt, { color: text[label] || "#5f6368" }]}>{label}</Text>
  </View>
);
const styles = StyleSheet.create({
  tag: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  txt: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
});
