import { usePrinterStore } from '../store/useStore';

class MoonrakerClient {
    constructor() {
        this.socket = null;
        this.reconnectTimer = null;
    }

    connect(host) {
        if (this.socket) {
            this.socket.close();
        }

        const wsUrl = `ws://${host}/websocket`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('Connected to Moonraker');
            usePrinterStore.getState().setConnectionStatus(true);
            this.subscribe();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.socket.onclose = () => {
            console.log('Moonraker connection closed');
            usePrinterStore.getState().setConnectionStatus(false);
            this.scheduleReconnect(host);
        };

        this.socket.onerror = (error) => {
            console.error('Moonraker WebSocket error:', error);
        };
    }

    scheduleReconnect(host) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(host), 5000);
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
            const printerUpdate = {};

            if (update.extruder) {
                printerUpdate.temperature = {
                    ...usePrinterStore.getState().temperature,
                    tool: update.extruder.temperature
                };
            }
            if (update.heater_bed) {
                printerUpdate.temperature = {
                    ...usePrinterStore.getState().temperature,
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

            usePrinterStore.getState().updateStatus(printerUpdate);
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
