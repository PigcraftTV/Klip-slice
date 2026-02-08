import React, { Suspense, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useSTL } from '@react-three/drei/native';
import { PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei/native';

function Model({ url }) {
    const geom = useSTL(url);

    return (
        <mesh geometry={geom} castShadow receiveShadow>
            <meshStandardMaterial color="#3B82F6" roughness={0.3} metalness={0.8} />
        </mesh>
    );
}

export default function STLPreview({ fileUri }) {
    if (!fileUri) return null;

    return (
        <View style={styles.container}>
            <Canvas shadows>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[100, 100, 100]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[100, 100, 100]} intensity={1} castShadow />
                    <spotLight position={[-100, 100, 100]} angle={0.15} penumbra={1} intensity={1} />

                    <Model url={fileUri} />

                    <OrbitControls />
                    <Environment preset="city" />
                    <gridHelper args={[200, 20]} rotation={[0, 0, 0]} />
                </Suspense>
            </Canvas>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 16,
    },
});
