# Klip-slice

**Klip-slice** is a premium open-source mobile companion for 3D printing enthusiasts. It bridges the gap between searching for models and starting a print, all from your Android or iOS device.

##  Key Features

- ** Smart Model Sourcing**: Integrated browser for **Printables**, **MakerWorld**, and **Thingiverse**.
  - *Automagic Interception*: Detects `.stl` and `.3mf` downloads and imports them directly into the app.
- ** 3D Inspect Mode**: High-performance 3D preview using React Three Fiber. Inspect your models with smooth orbit controls before slicing.
- ** Hybrid Slicing Engine**:
  - **Local Slicing**: Run **Cura Engine (WASM)** directly on your phone for quick jobs.
  - **Remote Slicing**: One-tap trigger to run **OrcaSlicer CLI** on your Raspberry Pi for maximum quality.
- ** Klipper Dashboard**: Full real-time telemetry via **Moonraker**.
  - Monitor temperatures, job progress, and fan speeds.
  - Securely connect from anywhere via **Tailscale**.

##  Architecture

- **Framework**: React Native with [Expo SDK 52](https://expo.dev)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **3D Graphics**: [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) & [Expo GL](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- **Networking**: WebSockets for Moonraker real-time data.

##  Setup & Local Development

### 1. Requirements
- Node.js & npm
- Android Studio / Xcode
- A Raspberry Pi running Klipper/Moonraker (for remote features)
- Tailscale (recommended for remote access)

### 2. Installation
```bash
npm install
```

### 3. Running Locally
```bash
# Start the app on Android (requires local SDK)
npm run android

# Start the app on iOS (requires macOS & Xcode)
npm run ios
```

##  Building for Android
To build a local APK without cloud dependencies:
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```
The APK will be located in `android/app/build/outputs/apk/release/`.

##  Open Source
This project is built for the community. Feel free to contribute by opening issues or pull requests.

---
*Developed with ❤️ for the 3D Printing Community.*


----
*Disclaimer*

Im not good in coding with react-native (yet). So I am using Antigravity to help me with certain problems.
