import React, { useRef, useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { ChevronLeft, ChevronRight, RotateCw, Home, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../store/useStore';

const INITIAL_URL = 'https://www.printables.com';

export default function Browser() {
    const webViewRef = useRef(null);
    const [url, setUrl] = useState(INITIAL_URL);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [loading, setLoading] = useState(false);
    const setLastDownloadedFile = useAppStore((state) => state.setLastDownloadedFile);

    const handleNavigationStateChange = (navState) => {
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setUrl(navState.url);
    };

    const onShouldStartLoadWithRequest = (request) => {
        // Detect STL or 3MF downloads
        const isModelFile = request.url.toLowerCase().endsWith('.stl') ||
            request.url.toLowerCase().endsWith('.3mf') ||
            request.url.includes('/download/');

        if (isModelFile && !request.url.includes('google.com')) {
            handleDownload(request.url);
            return false; // Prevent WebView from loading the download URL
        }
        return true;
    };

    const handleDownload = async (downloadUrl) => {
        try {
            setLoading(true);
            const filename = downloadUrl.split('/').pop().split('?')[0] || 'model.stl';
            const fileUri = FileSystem.cacheDirectory + filename;

            const downloadResumable = FileSystem.createDownloadResumable(
                downloadUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    // Could implement progress bar here
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            console.log('Finished downloading to ', uri);
            setLastDownloadedFile(uri);
            // Trigger Slicing Modal/Screen here
            alert(`Downloaded: ${filename}\nReady to slice!`);
        } catch (e) {
            console.error(e);
            alert('Download failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.addressBar}>
                <TouchableOpacity onPress={() => webViewRef.current?.goBack()} disabled={!canGoBack}>
                    <ChevronLeft color={canGoBack ? '#F8FAFC' : '#475569'} size={24} />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={url}
                    onChangeText={setUrl}
                    onSubmitEditing={() => webViewRef.current?.reload()}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={() => webViewRef.current?.reload()}>
                    <RotateCw color="#F8FAFC" size={20} />
                </TouchableOpacity>
            </View>

            <WebView
                ref={webViewRef}
                source={{ uri: INITIAL_URL }}
                onNavigationStateChange={handleNavigationStateChange}
                onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator color="#3B82F6" size="large" />
                    </View>
                )}
            />

            <View style={styles.bottomBar}>
                <TouchableOpacity onPress={() => webViewRef.current?.injectJavaScript(`window.location.href = '${INITIAL_URL}'`)}>
                    <Home color="#F8FAFC" size={24} />
                </TouchableOpacity>
                <Download color="#475569" size={24} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    addressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1E293B',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 36,
        backgroundColor: '#334155',
        borderRadius: 8,
        paddingHorizontal: 12,
        color: '#F8FAFC',
        fontSize: 14,
    },
    webview: {
        flex: 1,
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1E293B',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
});
