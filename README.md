# Remote Slicing & Printing for Klipper (Orca + Cura)

This project provides a **remote slicing workflow for Klipper-based 3D printers**.

- **Server-side slicing** is done using **OrcaSlicer (CLI / headless)** on a Raspberry Pi
- **Local slicing** is optionally done with **Cura (WASD)** on a desktop machine
- G-Code is sent to Klipper via **Moonraker**
- Designed for LAN / VPN usage (e.g. Tailscale)

The goal is a **fully open-source, self-hosted alternative** to cloud-based slicing solutions.

---


---

## Slicing Modes

### 1️⃣ Server-Side Slicing (OrcaSlicer – Recommended)

- OrcaSlicer runs **headless** on the Raspberry Pi
- Models are uploaded to the Pi
- Slicing is done via **OrcaSlicer CLI**
- Generated G-Code is placed directly into Klipper's `gcodes` directory
- Moonraker detects the file automatically

**Advantages**
- No Android/Client slicing required
- Consistent profiles
- Works over VPN (e.g. Tailscale)
- Fully open source

---

### 2️⃣ Local Slicing (Cura – WASD)

- Cura runs locally on a desktop PC
- Slicing is done locally
- G-Code is uploaded manually or via Moonraker

**Advantages**
- Fast preview & manual tuning
- No server load
- Familiar Cura workflow

---

## Requirements

### Server (Raspberry Pi)
- Raspberry Pi 4 / 5 (4GB+ recommended)
- Klipper
- Moonraker
- OrcaSlicer (CLI usage)
- Linux (Debian / Raspberry Pi OS)
- Optional: Docker
- Optional: Tailscale

### Client
- Web browser / API client
- Optional: Android device
- Optional: Cura (Desktop)

---

## OrcaSlicer CLI Usage (Example)

```bash
orca-slicer \
  --slice 0 \
  --load-settings profiles/printer.json \
  --load-filaments profiles/filament.json \
  --outputdir /home/pi/printer_data/gcodes \
  models/example.stl


⚠️ Note: OrcaSlicer CLI is not officially documented and may change between versions.

Networking

This setup is intended to run:

locally in LAN or

securely over VPN (e.g. Tailscale)

No cloud services required.

License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

It uses OrcaSlicer, which is also licensed under AGPL-3.0.
If you run this software as a service, you must provide the source code
to users interacting with it over a network.

See the LICENSE file for details.

Disclaimer

This project is not affiliated with:

OrcaSlicer

Ultimaker Cura

Klipper

Moonraker

All trademarks belong to their respective owners.


---
