import React from 'react';
import { StyleSheet, View, Text, ScrollView, Animated } from 'react-native';
import { usePrinterStore } from '../store/useStore';
import { Thermometer, Clock, FileText, Activity } from 'lucide-react-native';

const StatusBadge = ({ status }) => {
    const colors = {
        printing: '#10B981',
        idle: '#3B82F6',
        paused: '#F59E0B',
        error: '#EF4444',
    };

    return (
        <View style={[styles.badge, { backgroundColor: colors[status] || '#64748B' }]}>
            <Text style={styles.badgeText}>{status?.toUpperCase() || 'OFFLINE'}</Text>
        </View>
    );
};

export default function PrinterDashboard() {
    const { status, temperature, progress, currentFile, isConnected } = usePrinterStore();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Printer Status</Text>
                    <Text style={styles.subtitle}>{isConnected ? 'Connected via Tailscale' : 'Waiting for connection...'}</Text>
                </View>
                <StatusBadge status={status} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.webcamPlaceholder}>
                    <Activity size={32} color="#475569" />
                    <Text style={styles.webcamText}>Webcam Stream</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.card}>
                        <Thermometer size={24} color="#EF4444" />
                        <Text style={styles.cardLabel}>Hotend</Text>
                        <Text style={styles.cardValue}>{temperature.tool.toFixed(1)}°C</Text>
                    </View>
                    <View style={styles.card}>
                        <Thermometer size={24} color="#3B82F6" />
                        <Text style={styles.cardLabel}>Bed</Text>
                        <Text style={styles.cardValue}>{temperature.bed.toFixed(1)}°C</Text>
                    </View>
                </View>

                <View style={styles.progressCard}>
                    <View style={styles.cardHeader}>
                        <Activity size={24} color="#10B981" />
                        <Text style={styles.cardTitle}>Printing Progress</Text>
                        <Text style={styles.progressText}>{(progress * 100).toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <View style={styles.fileRow}>
                        <FileText size={18} color="#94A3B8" />
                        <Text style={styles.fileName} numberOfLines={1}>{currentFile || 'No active job'}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '900',
    },
    scrollContent: {
        padding: 24,
        gap: 20,
    },
    webcamPlaceholder: {
        height: 200,
        backgroundColor: '#1E293B',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#334155',
        borderStyle: 'dashed',
    },
    webcamText: {
        color: '#475569',
        marginTop: 8,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    card: {
        flex: 1,
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 24,
        gap: 8,
    },
    cardLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    cardValue: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '800',
    },
    progressCard: {
        backgroundColor: '#1E293B',
        padding: 24,
        borderRadius: 24,
        gap: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cardTitle: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
    },
    progressText: {
        color: '#10B981',
        fontSize: 20,
        fontWeight: '800',
    },
    progressBarBg: {
        height: 12,
        backgroundColor: '#334155',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fileName: {
        color: '#94A3B8',
        fontSize: 14,
        flex: 1,
    },
});
