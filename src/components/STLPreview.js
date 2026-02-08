import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function STLPreview({ fileUri }) {
    if (!fileUri) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No file loaded</Text>
                <Text style={styles.emptySubtext}>Download an STL from the Browser tab</Text>
            </View>
        );
    }

    const filename = fileUri.split('/').pop();

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔷</Text>
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                    <Text style={styles.emoji}>📄</Text>
                    <Text style={styles.infoLabel}>File:</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>{filename}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.emoji}>✅</Text>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoValue, styles.readyText]}>Ready to slice</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    emptyContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 40,
        marginHorizontal: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#334155',
        borderStyle: 'dashed',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    infoContainer: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        width: 60,
    },
    infoValue: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '500',
    },
    readyText: {
        color: '#10B981',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#475569',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    icon: {
        fontSize: 64,
    },
    emptyIcon: {
        fontSize: 48,
    },
    emoji: {
        fontSize: 18,
    },
});
