import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import spacing from '../../design/spacing';

const PollMasonryList = ({
  items,
  columns,
  contentContainerStyle,
  renderCard,
  emptyState,
}) => {
  const gridColumns = columns > 1 ? 2 : 1;

  if (!items.length) {
    return <View style={contentContainerStyle}>{emptyState}</View>;
  }

  return (
    <View style={contentContainerStyle}>
      <View style={[styles.pollGrid, gridColumns === 1 && styles.pollGridSingle]}>
        {items.map((item) => (
          <View key={item.id} style={[styles.pollGridItem, gridColumns === 1 && styles.pollGridItemSingle]}>
            {renderCard(item)}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pollGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pollGridSingle: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  pollGridItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  pollGridItemSingle: {
    width: '100%',
  },
});

export default memo(PollMasonryList);
