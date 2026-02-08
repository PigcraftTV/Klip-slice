import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Globe, Cpu, LayoutDashboard, Settings, FileText } from 'lucide-react-native';

import Browser from './src/components/Browser';
import PrinterDashboard from './src/components/PrinterDashboard';
import STLPreview from './src/components/STLPreview';
import SlicerConfig from './src/components/SlicerConfig';
import PrinterManager from './src/components/PrinterManager';
import { useAppStore, usePrinterStore } from './src/store/useStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');
  const lastDownloadedFile = useAppStore((state) => state.lastDownloadedFile);
  const { printers } = usePrinterStore();

  useEffect(() => {
    if (printers.length === 0) {
      setActiveTab('settings');
    }
  }, [printers.length]);

  const renderContent = () => {
    switch (activeTab) {
      case 'browser':
        return <Browser />;
      case 'dashboard':
        return <PrinterDashboard />;
      case 'slicer':
        return (
          <View style={styles.slicerContainer}>
            {lastDownloadedFile && (
              <View style={styles.fileStatus}>
                <FileText color="#3B82F6" size={20} />
                <Text style={styles.fileStatusText} numberOfLines={1}>
                  {lastDownloadedFile.split('/').pop()}
                </Text>
              </View>
            )}
            <STLPreview fileUri={lastDownloadedFile} />
            <SlicerConfig
              onSliceLocal={() => alert('Starting local slice...')}
              onSliceRemote={() => alert('Sending to Pi for Orca slicing...')}
            />
          </View>
        );
      case 'settings':
        return <PrinterManager onBack={() => setActiveTab('browser')} />;
      default:
        return <Browser />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.tabBar}>
        <TabButton
          active={activeTab === 'browser'}
          onPress={() => setActiveTab('browser')}
          icon={Globe}
          label="Browse"
        />
        <TabButton
          active={activeTab === 'slicer'}
          onPress={() => setActiveTab('slicer')}
          icon={Cpu}
          label="Slice"
          badge={!!lastDownloadedFile}
        />
        <TabButton
          active={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
          icon={LayoutDashboard}
          label="Printer"
        />
        <TabButton
          active={activeTab === 'settings'}
          onPress={() => setActiveTab('settings')}
          icon={Settings}
          label="Setup"
        />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ active, onPress, icon: Icon, label, badge }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Icon color={active ? '#3B82F6' : '#94A3B8'} size={24} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {badge && <View style={styles.dot} />}
    </TouchableOpacity>
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
  },
  fileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    marginTop: 20,
  },
  fileStatusText: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  }
});
