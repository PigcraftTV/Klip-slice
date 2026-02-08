import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Layers, Thermometer, Box, Zap, Cpu, Upload, Settings } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Slider from '@react-native-community/slider';
import { useAppStore, usePrinterStore } from '../store/useStore';
import { moonraker } from '../api/moonraker';
import SlicerBridge from './SlicerBridge';

const CONFIG_OPTIONS = {
    layerHeight: [0.12, 0.16, 0.2, 0.28],
    infill: [10, 15, 20, 40, 100],
};

export default function SlicerConfig({ onSliceLocal, onSliceRemote }) {
    const { slicingProfiles, addProfile, lastDownloadedFile } = useAppStore();
    const [selectedProfileId, setSelectedProfileId] = useState(slicingProfiles[0]?.id);
    const selectedProfile = slicingProfiles.find(p => p.id === selectedProfileId) || slicingProfiles[0];

    // Slicing Parameters
    const [selectedLH, setSelectedLH] = useState(selectedProfile?.layerHeight || 0.2);
    const [selectedInfill, setSelectedInfill] = useState(selectedProfile?.infill || 15);
    const [useSupports, setUseSupports] = useState(false);

    // Temperature Controls
    const [bedTemp, setBedTemp] = useState(60);
    const [nozzleTemp, setNozzleTemp] = useState(200);

    const [sliceStatus, setSliceStatus] = useState(null); // null, 'slicing', 'success', 'error'
    const [sliceProgress, setSliceProgress] = useState(0);
    const [gcodeFile, setGcodeFile] = useState(null);
    const [gcodeUri, setGcodeUri] = useState(null);

    const slicerBridgeRef = useRef(null);

    useEffect(() => {
        if (selectedProfile) {
            setSelectedLH(selectedProfile.layerHeight);
            setSelectedInfill(selectedProfile.infill);
        }
    }, [selectedProfileId]);

    const getGcodeFilename = () => {
        if (!lastDownloadedFile) return 'model.gcode';
        const name = lastDownloadedFile.split('/').pop().split('.')[0];
        return `${name}.gcode`;
    };

    const handleSliceLocal = async () => {
        if (!lastDownloadedFile) {
            alert('No STL file loaded! Please download a file first.');
            return;
        }

        try {
            setSliceStatus('slicing');
            setSliceProgress(0);

            // Read the file as Base64 to pass to WebView
            const fileContent = await FileSystem.readAsStringAsync(lastDownloadedFile, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const settings = {
                layerHeight: selectedLH,
                infill: selectedInfill,
                bedTemp,
                nozzleTemp,
                useSupports
            };

            // Trigger the bridge
            slicerBridgeRef.current?.startSlicing(fileContent, settings);

        } catch (error) {
            console.error('Failed to read STL:', error);
            alert('Failed to read STL file: ' + error.message);
            setSliceStatus('error');
        }
    };

    const handleSliceProgress = (progress) => {
        setSliceProgress(progress);
    };

    const handleSliceComplete = (gcode) => {
        setSliceStatus('success');
        setSliceProgress(100);
        const filename = getGcodeFilename();
        setGcodeFile(filename);
        // Save the generated G-code to a temporary file
        const tempPath = FileSystem.cacheDirectory + filename;
        FileSystem.writeAsStringAsync(tempPath, gcode)
            .then(() => {
                setGcodeUri(tempPath);
                console.log('G-code saved to:', tempPath);
            })
            .catch(err => {
                console.error('Failed to save G-code:', err);
                alert('Failed to save G-code');
            });
    };

    const handleSliceError = (error) => {
        setSliceStatus('error');
        alert('Slicing failed: ' + error);
    };

    const handleSliceRemote = () => {
        // ... (keep existing remote logic if needed, or disable)
        alert('Remote slicing not configured yet.');
    };

    const handleUpload = async (startPrint = false) => {
        const { printers, selectedPrinterId } = usePrinterStore.getState();
        const activePrinter = printers.find(p => p.id === selectedPrinterId);

        if (!activePrinter?.host || !gcodeFile) {
            alert('No printer selected or no gcode generated');
            return;
        }

        try {
            let fileUriToUpload = gcodeUri;

            // If we didn't generate a local file (e.g. from Mock), ensure we have one.
            // But now handleSliceComplete saves it.
            if (!fileUriToUpload) {
                // Fallback for safety or manually generated mock content
                alert('No G-code file ready.');
                return;
            }

            console.log(`Uploading ${gcodeFile} from ${fileUriToUpload}`);

            // Upload to Moonraker
            const uploadResult = await moonraker.uploadFile(activePrinter.host, fileUriToUpload, gcodeFile);
            const uploadedPath = uploadResult.result?.item?.path || gcodeFile;

            alert(`✅ Upload successful!\n${gcodeFile} uploaded to ${activePrinter.name}`);

            if (startPrint) {
                await moonraker.startPrint(activePrinter.host, uploadedPath);
                alert(`🖨️ Print started!\n${gcodeFile} is now printing`);
            }
        } catch (error) {
            console.error('Upload/Print error:', error);
            alert(`❌ Action failed:\n${error.message}`);
        }
    };


    const handleImportConfig = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
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

    // ... (rest of file)

    return (
        <View style={styles.container}>
            {/* Hidden Bridge */}
            <SlicerBridge
                ref={slicerBridgeRef}
                onStatusUpdate={(status) => console.log('Slicer Status:', status)}
                onProgress={handleSliceProgress}
                onComplete={handleSliceComplete}
                onError={handleSliceError}
            />

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

                {/* Temperature Controls */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Thermometer size={20} color="#EF4444" />
                        <Text style={styles.sectionTitle}>Nozzle Temperature: {nozzleTemp}°C</Text>
                    </View>
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={180}
                            maximumValue={280}
                            step={5}
                            value={nozzleTemp}
                            onValueChange={setNozzleTemp}
                            minimumTrackTintColor="#EF4444"
                            maximumTrackTintColor="#334155"
                            thumbTintColor="#EF4444"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Thermometer size={20} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>Bed Temperature: {bedTemp}°C</Text>
                    </View>
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={110}
                            step={5}
                            value={bedTemp}
                            onValueChange={setBedTemp}
                            minimumTrackTintColor="#3B82F6"
                            maximumTrackTintColor="#334155"
                            thumbTintColor="#3B82F6"
                        />
                    </View>
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

                {lastDownloadedFile && (
                    <View style={styles.loadedFileCard}>
                        <Text style={styles.loadedFileLabel}>Loaded File:</Text>
                        <Text style={styles.loadedFileName}>{lastDownloadedFile.split('/').pop()}</Text>
                    </View>
                )}

                {!lastDownloadedFile && (
                    <View style={styles.warningCard}>
                        <Text style={styles.warningText}>⚠️ No STL file loaded</Text>
                        <Text style={styles.warningSubtext}>Download a file from the Browse tab first</Text>
                    </View>
                )}

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
                        <Text style={styles.statusText}>Slicing... {sliceProgress}%</Text>
                        <Text style={styles.statusSubText}>Processing Geometry...</Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.btnLocal} onPress={handleSliceLocal}>
                        <Cpu size={20} color="#F8FAFC" />
                        <Text style={styles.btnText}>Slice on Phone</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    statusSubText: {
        color: '#64748B',
        marginTop: 4,
    },
    loadedFileCard: {
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    loadedFileLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    loadedFileName: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    warningCard: {
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F59E0B',
        alignItems: 'center',
    },
    warningText: {
        color: '#F59E0B',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    warningSubtext: {
        color: '#94A3B8',
        fontSize: 12,
    },
    sliderContainer: {
        paddingHorizontal: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
});
