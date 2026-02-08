import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Plus, Trash2, Printer, CheckCircle2, X } from 'lucide-react-native';
import { usePrinterStore } from '../store/useStore';

export default function PrinterManager({ onBack }) {
    const { printers, addPrinter, removePrinter, selectPrinter, selectedPrinterId } = usePrinterStore();
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [host, setHost] = useState('');

    const handleAdd = () => {
        if (!name || !host) {
            Alert.alert('Error', 'Please enter a name and IP/Host');
            return;
        }
        addPrinter({ name, host });
        setName('');
        setHost('');
        setIsAdding(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Printers</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onBack}>
                    <X color="#F8FAFC" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.list}>
                {printers.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        style={[styles.printerCard, selectedPrinterId === p.id && styles.printerCardActive]}
                        onPress={() => selectPrinter(p.id)}
                    >
                        <View style={styles.printerInfo}>
                            <Printer color={selectedPrinterId === p.id ? '#3B82F6' : '#94A3B8'} size={24} />
                            <View>
                                <Text style={styles.printerName}>{p.name}</Text>
                                <Text style={styles.printerHost}>{p.host}</Text>
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            {selectedPrinterId === p.id && <CheckCircle2 color="#3B82F6" size={20} />}
                            <TouchableOpacity onPress={() => removePrinter(p.id)}>
                                <Trash2 color="#EF4444" size={20} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}

                {isAdding ? (
                    <View style={styles.addForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="Printer Name (e.g. Voron)"
                            placeholderTextColor="#64748B"
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="IP Address or Host"
                            placeholderTextColor="#64748B"
                            value={host}
                            onChangeText={setHost}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.formBtns}>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsAdding(false)}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleAdd}>
                                <Text style={styles.btnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.addPlaceholder} onPress={() => setIsAdding(true)}>
                        <Plus color="#94A3B8" size={24} />
                        <Text style={styles.addLabel}>Add New Printer</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '800',
    },
    closeBtn: {
        padding: 4,
    },
    list: {
        flex: 1,
    },
    printerCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    printerCardActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#1E293B',
    },
    printerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    printerName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    printerHost: {
        color: '#64748B',
        fontSize: 14,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addPlaceholder: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#334155',
    },
    addLabel: {
        color: '#94A3B8',
        marginTop: 8,
        fontWeight: '600',
    },
    addForm: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        gap: 12,
    },
    input: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 14,
        color: '#FFFFFF',
        fontSize: 16,
    },
    formBtns: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    btn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#334155',
    },
    saveBtn: {
        backgroundColor: '#3B82F6',
    },
    btnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
