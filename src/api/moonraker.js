import { usePrinterStore } from '../store/useStore';

class MoonrakerClient {
    constructor() {
        this.socket = null;
        this.reconnectTimer = null;
        this.currentHost = null;
        this.isConnecting = false;
        this.shouldReconnect = true;
    }

    connect(host) {
        if (!host || this.isConnecting || (this.currentHost === host && this.socket?.readyState === WebSocket.OPEN)) {
            return;
        }

        this.disconnect();
        this.currentHost = host;
        this.isConnecting = true;
        this.shouldReconnect = true;

        const wsUrl = `ws://${host}/websocket`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('Connected to Moonraker');
            this.isConnecting = false;
            usePrinterStore.getState().setConnectionStatus(true);
            this.subscribe();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.socket.onclose = () => {
            console.log('Moonraker connection closed');
            this.isConnecting = false;
            usePrinterStore.getState().setConnectionStatus(false);

            if (this.shouldReconnect) {
                this.scheduleReconnect(host);
            }
        };

        this.socket.onerror = (error) => {
            console.error('Moonraker WebSocket error:', error);
            this.isConnecting = false;
        };
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.currentHost = null;
    }

    scheduleReconnect(host) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.shouldReconnect = true;
            this.connect(host);
        }, 5000);
    }

    subscribe() {
        // Subscribe to status updates
        const msg = {
            jsonrpc: '2.0',
            method: 'printer.objects.subscribe',
            params: {
                objects: {
                    display_status: null,
                    toolhead: null,
                    extruder: ["temperature", "target"],
                    heater_bed: ["temperature", "target"],
                    virtual_sdcard: ["progress", "is_active", "filename"],
                    print_stats: ["state", "filename", "progress"]
                }
            },
            id: 1
        };
        this.socket.send(JSON.stringify(msg));
    }

    handleMessage(data) {
        if (data.method === 'notify_status_update') {
            const update = data.params[0];
            const { activePrinterState, updateActivePrinterState } = usePrinterStore.getState();
            const printerUpdate = {};

            if (update.extruder) {
                printerUpdate.temperature = {
                    ...activePrinterState.temperature,
                    tool: update.extruder.temperature
                };
            }
            if (update.heater_bed) {
                printerUpdate.temperature = {
                    ...activePrinterState.temperature,
                    bed: update.heater_bed.temperature
                };
            }
            if (update.print_stats) {
                printerUpdate.status = update.print_stats.state;
                printerUpdate.currentFile = update.print_stats.filename;
            }
            if (update.display_status) {
                printerUpdate.progress = update.display_status.progress;
            }

            updateActivePrinterState(printerUpdate);
        }
    }

    async uploadFile(host, fileUri, filename) {
        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            name: filename,
            type: 'application/octet-stream',
        });

        try {
            const response = await fetch(`http://${host}/server/files/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return await response.json();
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }
}

export const moonraker = new MoonrakerClient();
