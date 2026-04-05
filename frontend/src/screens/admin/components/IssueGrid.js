import React, { memo, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import EmptyState from '../../../components/ui/EmptyState';
import { FiAlertTriangle } from 'react-icons/fi';
import IssueCard from './IssueCard';

const IssueGrid = ({
  issues,
  columns,
  isDark,
  loading,
  loadingIssueId,
  onOpenDetail,
  onOpenImage,
  onAssignWorker,
  onResolve,
  onChat,
}) => {
  const data = useMemo(() => {
    if (columns <= 1) {
      return issues;
    }

    const padded = [...issues];
    const remainder = padded.length % columns;

    if (remainder !== 0) {
      for (let index = remainder; index < columns; index += 1) {
        padded.push({ id: `placeholder-${index}-${issues.length}`, __placeholder: true });
      }
    }

    return padded;
  }, [issues, columns]);

  return (
    <FlatList
      key={columns}
      data={data}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        item.__placeholder ? (
          <View style={styles.placeholder} />
        ) : (
          <View style={styles.itemWrap}>
            <IssueCard
              item={item}
              isDark={isDark}
              loading={loading}
              loadingIssueId={loadingIssueId}
              stackActions={columns === 1}
              onOpenDetail={onOpenDetail}
              onOpenImage={onOpenImage}
              onAssignWorker={onAssignWorker}
              onResolve={onResolve}
              onChat={onChat}
            />
          </View>
        )
      }
      ListEmptyComponent={<EmptyState message="No issues found" icon={FiAlertTriangle} />}
      contentContainerStyle={styles.list}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : null}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  columnWrapper: {
    gap: 16,
  },
  itemWrap: {
    flex: 1,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  placeholder: {
    flex: 1,
    marginBottom: 16,
  },
});

export default memo(IssueGrid);
