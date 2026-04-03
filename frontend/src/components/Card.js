import {
  View,
  Text,
  StyleSheet
} from "react-native";
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children}</View>
);
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: 16, marginBottom: 12,
    boxShadowColor: "#000", boxShadowOpacity: 0.06, boxShadowRadius: 6, boxShadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
