import React, { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { FiSearch } from '../../utils/iconCompat';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import shadows from '../../design/shadows';

const SearchBar = ({ value, onChangeText, placeholder = 'Search', style, inputStyle }) => (
  <View style={[styles.container, shadows.card, style]}>
    <FiSearch size={16} color={colors.textSecondary} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      style={[styles.input, inputStyle]}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});

export default memo(SearchBar);
