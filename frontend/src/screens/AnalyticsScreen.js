import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

export default function AnalyticsScreen() {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  // Safe max width for sidebar layout
  const maxW = Dimensions.get("window").width > 768 ? Dimensions.get("window").width - 350 : Dimensions.get("window").width - 40;
  const screenWidth = maxW > 0 ? maxW : 300;

  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [pollStats, setPollStats] = useState({ totalPolls: 0, totalVotes: 0 });

  useEffect(() => {
    if (!userData?.societyId) return;

    const fetchStats = async () => {
      // Fetch Issues
      const qIssues = query(collection(db, "issues"), where("societyId", "==", userData.societyId));
      const issueDocs = await getDocs(qIssues);
      let t = 0; let r = 0; let p = 0;
      issueDocs.forEach(d => {
        t++;
        if (d.data().status === 'Resolved') r++;
        else p++;
      });
      setStats({ total: t, resolved: r, pending: p });

      // Fetch Polls
      const qPolls = query(collection(db, "polls"), where("societyId", "==", userData.societyId));
      const pollDocs = await getDocs(qPolls);
      let pollsT = 0; let votesT = 0;
      pollDocs.forEach(d => {
        pollsT++;
        const pData = d.data();
        if (pData.votes) votesT += Object.keys(pData.votes).length;
      });
      setPollStats({ totalPolls: pollsT, totalVotes: votesT });
    };

    fetchStats();
  }, [userData?.societyId]);

  const textColor = isDark ? "#ffffff" : "#000000";
  const bg = isDark ? "#121212" : "#ffffff";

  const chartConfig = {
    backgroundGradientFrom: isDark ? "#1e1e1e" : "#ffffff",
    backgroundGradientTo: isDark ? "#1e1e1e" : "#ffffff",
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const issueData = {
    labels: ["Total", "Resolved", "Pending"],
    datasets: [{ data: [stats.total, stats.resolved, stats.pending] }]
  };

  const pieData = [
    { name: 'Resolved', population: stats.resolved, color: '#16a34a', legendFontColor: textColor, legendFontSize: 15 },
    { name: 'Pending', population: stats.pending, color: '#f59e0b', legendFontColor: textColor, legendFontSize: 15 },
  ];

  const isEmpty = stats.total === 0 && pollStats.totalPolls === 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f8fafc" }]}>
      {isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>No Analytics Data Available</Text>
          <Text style={{ color: isDark ? '#cbd5e1' : '#64748b', marginTop: 8 }}>Once issues and polls are created, analytics will appear here.</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.title, { color: textColor }]}>Issue Analytics</Text>
          
          <View style={[styles.chartWrapper, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
            <BarChart
              data={issueData}
              width={screenWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero={true}
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              showValuesOnTopOfBars={true}
            />
          </View>

          <Text style={[styles.title, { color: textColor, marginTop: 20 }]}>Status Distribution</Text>
          <View style={[styles.chartWrapper, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
            <PieChart
              data={pieData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>

          <Text style={[styles.title, { color: textColor, marginTop: 20 }]}>Poll Participation</Text>
          <View style={[styles.chartWrapper, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff", padding: 30 }]}>
            <Text style={{color: textColor, fontSize: 18, marginBottom: 8, fontWeight: 'bold'}}>Total Polls: {pollStats.totalPolls}</Text>
            <Text style={{color: textColor, fontSize: 18, fontWeight: 'bold'}}>Total Votes Cast: {pollStats.totalVotes}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  chartWrapper: {
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  }
});
