import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Layers, Thermometer, Box, Zap, Cpu, Upload, Settings } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppStore } from '../store/useStore';

const CONFIG_OPTIONS = {
    layerHeight: [0.12, 0.16, 0.2, 0.28],
    infill: [10, 15, 20, 40, 100],
};

export default function SlicerConfig({ onSliceLocal, onSliceRemote }) {
    const { slicingProfiles, addProfile } = useAppStore();
    const [selectedProfileId, setSelectedProfileId] = useState(slicingProfiles[0]?.id);
    const selectedProfile = slicingProfiles.find(p => p.id === selectedProfileId) || slicingProfiles[0];

    const [selectedLH, setSelectedLH] = useState(selectedProfile?.layerHeight || 0.2);
    const [selectedInfill, setSelectedInfill] = useState(selectedProfile?.infill || 15);
    const [useSupports, setUseSupports] = useState(false);
    const [sliceStatus, setSliceStatus] = useState(null); // null, 'slicing', 'success', 'error'
    const [gcodeFile, setGcodeFile] = useState(null);

    useEffect(() => {
        if (selectedProfile) {
            setSelectedLH(selectedProfile.layerHeight);
            setSelectedInfill(selectedProfile.infill);
        }
    }, [selectedProfileId]);

    const handleSliceLocal = () => {
        setSliceStatus('slicing');
        setTimeout(() => {
            setSliceStatus('success');
            setGcodeFile('test_model.gcode');
        }, 2000);
        onSliceLocal?.();
    };

    const handleSliceRemote = () => {
        setSliceStatus('slicing');
        setTimeout(() => {
            setSliceStatus('success');
            setGcodeFile('test_model.gcode');
        }, 2000);
        onSliceRemote?.();
    };

    const handleUpload = (startPrint = false) => {
        alert(startPrint ? 'Uploading & starting print...' : 'Uploading to printer...');
    };

    const handleImportConfig = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
            });

            if (!result.canceled) {
                const response = await fetch(result.assets[0].uri);
                const fileContent = await response.json();

                if (fileContent.name && fileContent.layerHeight) {
                    addProfile(fileContent);
                    alert('Profile imported successfully!');
                } else {
                    alert('Invalid profile format. Needs "name" and "layerHeight".');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Failed to import config');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Slicer Settings</Text>
                <TouchableOpacity style={styles.importBtn} onPress={handleImportConfig}>
                    <Upload size={20} color="#3B82F6" />
                    <Text style={styles.importText}>Import</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Settings size={20} color="#94A3B8" />
                        <Text style={styles.sectionTitle}>Profile</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {slicingProfiles.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                style={[styles.chip, selectedProfileId === p.id && styles.chipActive]}
                                onPress={() => setSelectedProfileId(p.id)}
                            >
                                <Text style={[styles.chipText, selectedProfileId === p.id && styles.chipTextActive]}>{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

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

            {sliceStatus === 'success' && gcodeFile && (
                <View style={styles.successCard}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={styles.successTitle}>Slice Successful!</Text>
                    <Text style={styles.successFile}>{gcodeFile}</Text>

                    <View style={styles.uploadButtons}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUpload(false)}>
                            <Upload size={18} color="#F8FAFC" />
                            <Text style={styles.uploadBtnText}>Upload</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtnPrimary} onPress={() => handleUpload(true)}>
                            <Upload size={18} color="#F8FAFC" />
                            <Text style={styles.uploadBtnText}>Upload & Start</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {sliceStatus === 'slicing' && (
                <View style={styles.statusCard}>
                    <Text style={styles.statusIcon}>⚙️</Text>
                    <Text style={styles.statusText}>Slicing...</Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.btnLocal} onPress={handleSliceLocal}>
                    <Cpu size={20} color="#F8FAFC" />
                    <Text style={styles.btnText}>Slice on Phone (Cura)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnRemote} onPress={handleSliceRemote}>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    importBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#334155',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    importText: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '700',
    },
    successCard: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    successTitle: {
        color: '#10B981',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    successFile: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 16,
    },
    uploadButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    uploadBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#334155',
        padding: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadBtnPrimary: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#10B981',
        padding: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadBtnText: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '700',
    },
    statusCard: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    statusIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    statusText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
});
