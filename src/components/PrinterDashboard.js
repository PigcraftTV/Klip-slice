import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Animated, ActivityIndicator, Image, TouchableOpacity, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePrinterStore } from '../store/useStore';
import { Thermometer, Clock, FileText, Activity, Printer } from 'lucide-react-native';
import { moonraker } from '../api/moonraker';

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
    const { printers, selectedPrinterId, activePrinterState } = usePrinterStore();
    const { status, temperature, progress, currentFile, isConnected } = activePrinterState;
    const activePrinter = printers.find(p => p.id === selectedPrinterId);
    const [webcamUrl, setWebcamUrl] = useState(null);
    const [webcamError, setWebcamError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Get initial values from printer state, don't set hardcoded values
    const [speedPercent, setSpeedPercent] = useState(activePrinterState.speed || 100);
    const [fanPercent, setFanPercent] = useState(activePrinterState.fanSpeed || 0);
    const [acceleration, setAcceleration] = useState(String(activePrinterState.acceleration || 3000));

    // Update local state when printer state changes
    useEffect(() => {
        setSpeedPercent(activePrinterState.speed || 100);
        setFanPercent(activePrinterState.fanSpeed || 0);
        setAcceleration(String(activePrinterState.acceleration || 3000));
    }, [activePrinterState.speed, activePrinterState.fanSpeed, activePrinterState.acceleration]);

    const handleSpeedChange = (value) => {
        setSpeedPercent(value);
        if (activePrinter?.host) {
            moonraker.setSpeed(activePrinter.host, Math.round(value));
        }
    };

    const handleFanChange = (value) => {
        setFanPercent(value);
        if (activePrinter?.host) {
            moonraker.setFan(activePrinter.host, Math.round(value));
        }
    };

    const handleAccelChange = (value) => {
        setAcceleration(value);
        const accelNum = parseInt(value);
        if (activePrinter?.host && !isNaN(accelNum) && accelNum > 0) {
            moonraker.setAcceleration(activePrinter.host, accelNum);
        }
    };

    useEffect(() => {
        if (activePrinter?.host) {
            moonraker.connect(activePrinter.host);
            // Webcam - use unified logic respecting Nginx/Port 80
            setWebcamUrl(moonraker.getWebcamUrl(activePrinter.host));
            setWebcamError(false);
        }

        return () => {
            moonraker.disconnect();
            setWebcamUrl(null);
        };
    }, [selectedPrinterId, activePrinter?.host]);

    if (!activePrinter) {
        return (
            <View style={styles.centered}>
                <Printer color="#64748B" size={48} />
                <Text style={styles.noPrinter}>No printer selected</Text>
                <Text style={styles.subText}>Add or select a printer in the Setup tab.</Text>
            </View>
        );
    }

    if (!isConnected && status !== 'error') {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color="#3B82F6" size="large" />
                <Text style={styles.connecting}>Connecting to {activePrinter.name}...</Text>
                <Text style={styles.subText}>{activePrinter.host}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{activePrinter.name}</Text>
                </View>
                <StatusBadge status={status} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {webcamUrl && !webcamError ? (
                    <Image
                        source={{ uri: webcamUrl }}
                        style={styles.webcamStream}
                        resizeMode="cover"
                        onError={() => setWebcamError(true)}
                    />
                ) : (
                    <View style={styles.webcamPlaceholder}>
                        <Activity size={32} color="#475569" />
                        <Text style={styles.webcamText}>
                            {webcamError ? 'Webcam Unavailable' : 'Webcam Stream'}
                        </Text>
                    </View>
                )}

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

                <View style={styles.controlsCard}>
                    <Text style={styles.controlsTitle}>Printer Controls</Text>

                    <View style={styles.controlRow}>
                        <View style={styles.controlHeader}>
                            <Text style={styles.controlLabel}>Speed: {Math.round(speedPercent)}%</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={50}
                            maximumValue={200}
                            value={speedPercent}
                            onValueChange={handleSpeedChange}
                            minimumTrackTintColor="#3B82F6"
                            maximumTrackTintColor="#334155"
                            thumbTintColor="#3B82F6"
                        />
                    </View>

                    <View style={styles.controlRow}>
                        <View style={styles.controlHeader}>
                            <Text style={styles.controlLabel}>Fan: {Math.round(fanPercent)}%</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={100}
                            value={fanPercent}
                            onValueChange={handleFanChange}
                            minimumTrackTintColor="#3B82F6"
                            maximumTrackTintColor="#334155"
                            thumbTintColor="#3B82F6"
                        />
                    </View>

                    <View style={styles.controlRow}>
                        <Text style={styles.controlLabel}>Acceleration (mm/s²): {acceleration}</Text>
                        <TextInput
                            style={styles.controlInput}
                            value={acceleration}
                            onChangeText={setAcceleration}
                            onBlur={() => handleAccelChange(acceleration)}
                            keyboardType="numeric"
                            placeholder="3000"
                            placeholderTextColor="#475569"
                        />
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
    webcamStream: {
        height: 200,
        backgroundColor: '#000000',
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardIcon: {
        fontSize: 24,
    },
    controlsCard: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 24,
        gap: 16,
    },
    controlsTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    controlRow: {
        gap: 12,
    },
    controlLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    controlButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    controlBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#334155',
        borderRadius: 12,
        alignItems: 'center',
    },
    controlBtnActive: {
        backgroundColor: '#3B82F6',
    },
    controlBtnText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
    controlBtnTextActive: {
        color: '#FFFFFF',
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#0F172A',
    },
    noPrinter: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 20,
    },
    connecting: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
    },
    subText: {
        color: '#64748B',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    controlHeader: {
        marginBottom: 4,
    },
    controlInput: {
        backgroundColor: '#334155',
        color: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
});
