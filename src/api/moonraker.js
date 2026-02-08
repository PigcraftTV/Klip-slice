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

        const wsUrl = `ws://${host}:7125/websocket`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('Connected to Moonraker');
            this.isConnecting = false;
            usePrinterStore.getState().setConnectionStatus(true);

            // Wait for connection to stabilize before subscribing
            setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.fetchInitialState();
                    this.subscribe();
                }
            }, 500);
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

    async fetchInitialState() {
        if (!this.currentHost) return;

        try {
            // Fetch current printer state via HTTP
            const response = await fetch(`http://${this.currentHost}:7125/printer/objects/query?extruder&heater_bed&fan&print_stats&display_status&gcode_move&toolhead`);
            const data = await response.json();

            if (data.result && data.result.status) {
                const status = data.result.status;
                const { updateActivePrinterState } = usePrinterStore.getState();

                const printerUpdate = {
                    temperature: {
                        tool: status.extruder?.temperature || 0,
                        bed: status.heater_bed?.temperature || 0,
                    },
                    status: status.print_stats?.state || 'standby',
                    currentFile: status.print_stats?.filename || '',
                    progress: status.display_status?.progress || 0,
                    fanSpeed: Math.round((status.fan?.speed || 0) * 100),
                    speed: Math.round((status.gcode_move?.speed_factor || 1) * 100),
                    acceleration: status.toolhead?.max_accel || 3000,
                };

                updateActivePrinterState(printerUpdate);
                console.log('Initial state fetched:', printerUpdate);
            }
        } catch (error) {
            console.error('Failed to fetch initial state:', error);
        }
    }

    subscribe() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.log('Cannot subscribe: socket not ready');
            return;
        }

        // Subscribe to status updates
        const msg = {
            jsonrpc: '2.0',
            method: 'printer.objects.subscribe',
            params: {
                objects: {
                    display_status: null,
                    toolhead: ["max_accel", "max_accel_to_decel"],
                    extruder: ["temperature", "target"],
                    heater_bed: ["temperature", "target"],
                    virtual_sdcard: ["progress", "is_active", "filename"],
                    print_stats: ["state", "filename", "progress"],
                    fan: ["speed"],
                    gcode_move: ["speed_factor", "extrude_factor"]
                }
            },
            id: 1
        };

        try {
            this.socket.send(JSON.stringify(msg));
            console.log('Subscription request sent');
        } catch (error) {
            console.error('Failed to send subscription:', error);
        }
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
            if (update.fan) {
                printerUpdate.fanSpeed = Math.round((update.fan.speed || 0) * 100);
            }
            if (update.gcode_move) {
                if (update.gcode_move.speed_factor !== undefined) {
                    printerUpdate.speed = Math.round(update.gcode_move.speed_factor * 100);
                }
            }
            if (update.toolhead) {
                if (update.toolhead.max_accel !== undefined) {
                    printerUpdate.acceleration = update.toolhead.max_accel;
                }
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
            const response = await fetch(`http://${host}:7125/server/files/upload`, {
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

    async startPrint(host, filename) {
        try {
            const response = await fetch(`http://${host}:7125/printer/print/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename }),
            });
            return await response.json();
        } catch (error) {
            console.error('Start print failed:', error);
            throw error;
        }
    }

    async sendGcode(host, gcode) {
        try {
            const response = await fetch(`http://${host}:7125/printer/gcode/script`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ script: gcode }),
            });
            return await response.json();
        } catch (error) {
            console.error('Send GCode failed:', error);
            throw error;
        }
    }

    async setSpeed(host, speedPercent) {
        const speedFactor = speedPercent / 100;
        return this.sendGcode(host, `M220 S${speedPercent}`);
    }

    async setFan(host, fanPercent) {
        const fanValue = Math.round((fanPercent / 100) * 255);
        return this.sendGcode(host, `M106 S${fanValue}`);
    }

    async setAcceleration(host, accel) {
        return this.sendGcode(host, `SET_VELOCITY_LIMIT ACCEL=${accel}`);
    }

    getWebcamUrl(host) {
        // Try common webcam endpoints
        return `http://${host}:8080/?action=stream`;
    }
}

export const moonraker = new MoonrakerClient();
