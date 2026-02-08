import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { WebView } from 'react-native-webview';

// A lightweight STL parser and G-code generator embedded in HTML/JS
const SLICER_HTML = `
<!DOCTYPE html>
<html>
<head>
    <style>body { font-family: sans-serif; color: white; background: #0F172A; text-align: center; padding: 20px; }</style>
</head>
<body>
    <h2>Klip-slice Engine</h2>
    <div id="status">Ready</div>
    <script>
        const log = (msg) => {
            document.getElementById('status').innerText = msg;
        };

        const sendProgress = (percent) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'PROGRESS', 
                payload: percent 
            }));
        };

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Helper: Base64 to ArrayBuffer (Chunked to avoid freezing)
        async function base64ToArrayBuffer(base64) {
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            const chunk = 500000; // 500KB chunks
            
            for (let i = 0; i < len; i += chunk) {
                const end = Math.min(i + chunk, len);
                for (let j = i; j < end; j++) {
                    bytes[j] = binary_string.charCodeAt(j);
                }
                // Report read progress (0-10%)
                const progress = Math.round((i / len) * 10);
                sendProgress(progress);
                await delay(0);
            }
            return bytes.buffer;
        }

        // Helper: Parse STL (Async/Chunked)
        async function parseSTL(buffer) {
            const data = new DataView(buffer);
            const triangleCount = data.getUint32(80, true);
            let offset = 84;
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;

            const chunk = 5000; // Process 5000 triangles per tick
            
            for (let i = 0; i < triangleCount; i += chunk) {
                const end = Math.min(i + chunk, triangleCount);
                
                for (let j = i; j < end; j++) {
                    // Normal (12 bytes) - skip
                    // Vertex 1
                    const x1 = data.getFloat32(offset + 12, true);
                    const y1 = data.getFloat32(offset + 16, true);
                    const z1 = data.getFloat32(offset + 20, true);
                    // Vertex 2 ...
                    const x2 = data.getFloat32(offset + 24, true);
                    const y2 = data.getFloat32(offset + 28, true);
                    const z2 = data.getFloat32(offset + 32, true);
                    // Vertex 3 ...
                    const x3 = data.getFloat32(offset + 36, true);
                    const y3 = data.getFloat32(offset + 40, true);
                    const z3 = data.getFloat32(offset + 44, true);

                    [x1, x2, x3].forEach(v => { minX = Math.min(minX, v); maxX = Math.max(maxX, v); });
                    [y1, y2, y3].forEach(v => { minY = Math.min(minY, v); maxY = Math.max(maxY, v); });
                    [z1, z2, z3].forEach(v => { minZ = Math.min(minZ, v); maxZ = Math.max(maxZ, v); });

                    offset += 50; 
                }
                
                // Report parse progress (10-50%)
                const progress = 10 + Math.round((i / triangleCount) * 40);
                sendProgress(progress);
                await delay(0);
            }
            return { minX, maxX, minY, maxY, minZ, maxZ, triangleCount };
        }

        window.addEventListener('message', async (event) => {
            const { type, payload } = JSON.parse(event.data);
            if (type === 'SLICE') {
                try {
                    log('Decoding File...');
                    sendProgress(0);
                    
                    const { stlData, settings } = payload;
                    const buffer = await base64ToArrayBuffer(stlData);
                    
                    log('Parsing STL...');
                    const bounds = await parseSTL(buffer);
                    
                    log(\`Analyzed: \${bounds.triangleCount} triangles\`);
                    sendProgress(50);
                    
                    // Generate G-code
                    const { minX, maxX, minY, maxY } = bounds;
                    const width = maxX - minX;
                    const depth = maxY - minY;
                    const centerX = minX + (width / 2);
                    const centerY = minY + (depth / 2);
                    
                    // Center on bed (110, 110)
                    const bedCenter = 110;
                    const startX = bedCenter - (width / 2);
                    const startY = bedCenter - (depth / 2);
                    const endX = startX + width;
                    const endY = startY + depth;

                    const date = new Date().toISOString();
                    const { bedTemp, nozzleTemp, layerHeight } = settings;

                    let gcode = \`; Generated by Klip-slice (Client Engine)
; Date: \${date}
; Geometry: \${width.toFixed(1)}x\${depth.toFixed(1)}mm
; Min/Max: X[\${minX.toFixed(1)},\${maxX.toFixed(1)}] Y[\${minY.toFixed(1)},\${maxY.toFixed(1)}]
; Settings: Bed:\${bedTemp} Nozzle:\${nozzleTemp} LH:\${layerHeight}

M140 S\${bedTemp}
M104 S\${nozzleTemp}
M190 S\${bedTemp}
M109 S\${nozzleTemp}
G28
G92 E0
G1 Z5 F3000

; Priming
G1 X0.1 Y20 Z0.3 F5000.0
G1 X0.1 Y100.0 Z0.3 F1500.0 E15
G1 X0.4 Y100.0 Z0.3 F5000.0
G1 X0.4 Y20 Z0.3 F1500.0 E30
G92 E0

; Move to Object Start (Bounding Box)
G1 Z\${layerHeight} F3000
G1 X\${startX.toFixed(2)} Y\${startY.toFixed(2)} F9000

; Print Bounding Box Skirt
G1 X\${endX.toFixed(2)} Y\${startY.toFixed(2)} E2 F1800
G1 X\${endX.toFixed(2)} Y\${endY.toFixed(2)} E4
G1 X\${startX.toFixed(2)} Y\${endY.toFixed(2)} E6
G1 X\${startX.toFixed(2)} Y\${startY.toFixed(2)} E8
\`;

                    // Infill pattern (ZigZag)
                    gcode += \`
; infill pattern
\`;
                    let e = 8;
                    const step = 2; // Finer step for more lines
                    const totalSteps = (endY - 2 - (startY + 2)) / step;
                    let currentStep = 0;

                    for (let y = startY + 2; y < endY - 2; y += step) {
                        e += 1;
                        gcode += \`G1 X\${startX + 2} Y\${y.toFixed(2)} E\${e.toFixed(2)} F1800\\n\`;
                        e += 1;
                        gcode += \`G1 X\${endX - 2} Y\${y.toFixed(2)} E\${e.toFixed(2)}\\n\`;
                        
                        currentStep++;
                        // Report generation progress (50-100%)
                        if (currentStep % 10 === 0) {
                            const genProgress = 50 + Math.round((currentStep / totalSteps) * 50);
                            sendProgress(genProgress);
                            await delay(0);
                        }
                    }

                    gcode += \`
; Footer
M104 S0
M140 S0
G28 X0 Y0
M84
\`;

                    sendProgress(100);
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'COMPLETE', 
                        payload: gcode 
                    }));
                    
                } catch (e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'ERROR', 
                        payload: e.message 
                    }));
                }
            }
        });
    </script>
</body>
</html>
`;

const SlicerBridge = forwardRef(({ onStatusUpdate, onComplete, onError, onProgress }, ref) => {
    const webViewRef = useRef(null);

    useImperativeHandle(ref, () => ({
        startSlicing: (stlData, settings) => {
            const msg = JSON.stringify({ type: 'SLICE', payload: { stlData, settings } });
            if (webViewRef.current) {
                webViewRef.current.postMessage(msg);
            }
        }
    }));

    const onMessage = (event) => {
        try {
            const { type, payload } = JSON.parse(event.nativeEvent.data);
            if (type === 'STATUS') onStatusUpdate && onStatusUpdate(payload);
            if (type === 'PROGRESS') onProgress && onProgress(payload);
            if (type === 'COMPLETE') onComplete && onComplete(payload);
            if (type === 'ERROR') onError && onError(payload);
        } catch (err) {
            console.error('Bridge Message Parse Error', err);
        }
    };

    return (
        <WebView
            ref={webViewRef}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            source={{ html: SLICER_HTML }}
            onMessage={onMessage}
            javaScriptEnabled={true}
            originWhitelist={['*']}
        />
    );
});

export default SlicerBridge;
