import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Layers, Thermometer, Box, Zap, Cpu } from 'lucide-react-native';

const CONFIG_OPTIONS = {
    layerHeight: [0.12, 0.16, 0.2, 0.28],
    infill: [10, 15, 20, 40, 100],
};

export default function SlicerConfig({ onSliceLocal, onSliceRemote }) {
    const [selectedLH, setSelectedLH] = useState(0.2);
    const [selectedInfill, setSelectedInfill] = useState(15);
    const [useSupports, setUseSupports] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Slicing Configuration</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Layers size={20} color="#94A3B8" />
                        <Text style={styles.sectionTitle}>Layer Height</Text>
                    </View>
                    <View style={styles.chipRow}>
                        {CONFIG_OPTIONS.layerHeight.map(h => (
                            <TouchableOpacity
                                key={h}
                                style={[styles.chip, selectedLH === h && styles.chipActive]}
                                onPress={() => setSelectedLH(h)}
                            >
                                <Text style={[styles.chipText, selectedLH === h && styles.chipTextActive]}>{h}mm</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Box size={20} color="#94A3B8" />
                        <Text style={styles.sectionTitle}>Infill %</Text>
                    </View>
                    <View style={styles.chipRow}>
                        {CONFIG_OPTIONS.infill.map(i => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.chip, selectedInfill === i && styles.chipActive]}
                                onPress={() => setSelectedInfill(i)}
                            >
                                <Text style={[styles.chipText, selectedInfill === i && styles.chipTextActive]}>{i}%</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.labelRow}>
                        <Zap size={20} color="#94A3B8" />
                        <Text style={styles.sectionTitle}>Generate Supports</Text>
                    </View>
                    <Switch
                        value={useSupports}
                        onValueChange={setUseSupports}
                        trackColor={{ false: '#334155', true: '#3B82F6' }}
                    />
                </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.btnLocal} onPress={onSliceLocal}>
                    <Cpu size={20} color="#F8FAFC" />
                    <Text style={styles.btnText}>Slice on Phone (Cura)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnRemote} onPress={onSliceRemote}>
                    <Zap size={20} color="#F8FAFC" />
                    <Text style={styles.btnText}>Slice on Pi (Orca)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#1E293B',
        borderRadius: 24,
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#F8FAFC',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94A3B8',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#334155',
        borderWidth: 1,
        borderColor: '#475569',
    },
    chipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#60A5FA',
    },
    chipText: {
        color: '#CBD5E1',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        gap: 12,
        marginTop: 'auto',
    },
    btnLocal: {
        flexDirection: 'row',
        backgroundColor: '#334155',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    btnRemote: {
        flexDirection: 'row',
        backgroundColor: '#3B82F6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    btnText: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
});
