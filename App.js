import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Globe, Cpu, LayoutDashboard } from 'lucide-react-native';

import Browser from './src/components/Browser';
import PrinterDashboard from './src/components/PrinterDashboard';
import STLPreview from './src/components/STLPreview';
import SlicerConfig from './src/components/SlicerConfig';
import { useAppStore } from './src/store/useStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');
  const lastDownloadedFile = useAppStore((state) => state.lastDownloadedFile);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        {activeTab === 'browser' && <Browser />}
        {activeTab === 'dashboard' && <PrinterDashboard />}
        {activeTab === 'slicer' && (
          <View style={styles.slicerContainer}>
            <STLPreview fileUri={lastDownloadedFile} />
            <SlicerConfig
              onSliceLocal={() => alert('Starting local slice...')}
              onSliceRemote={() => alert('Sending to Pi for Orca slicing...')}
            />
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('browser')}
        >
          <Globe color={activeTab === 'browser' ? '#3B82F6' : '#94A3B8'} size={24} />
          <Text style={[styles.tabText, activeTab === 'browser' && styles.tabTextActive]}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('slicer')}
        >
          <Cpu color={activeTab === 'slicer' ? '#3B82F6' : '#94A3B8'} size={24} />
          <Text style={[styles.tabText, activeTab === 'slicer' && styles.tabTextActive]}>Slice</Text>
          {lastDownloadedFile && <View style={styles.dot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard color={activeTab === 'dashboard' ? '#3B82F6' : '#94A3B8'} size={24} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>Printer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  slicerContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  dot: {
    position: 'absolute',
    top: 15,
    right: '35%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  }
});
