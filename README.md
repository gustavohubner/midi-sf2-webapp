# SF2 Workstation

**SF2 Workstation** is a high-performance, web-based audio synthesis environment engineered with React and the Web Audio API. It leverages `spessasynth_lib` and AudioWorklets to provide low-latency SoundFont (.sf2) playback, real-time digital signal processing (DSP), and intelligent harmonic analysis.

Live Demo: https://gustavohubner.github.io/midi-sf2-webapp/

![SF2 Workstation](public/screenshot.png)

## System Architecture

The application is built upon a modular tri-layer synthesis engine, designed to emulate professional hardware workstations.

### 🎹 Core Audio Engine
- **Synthesis Kernel**: Utilizes `spessasynth_lib` for SoundFont rendering, supporting standard `.sf2` specifications.
- **AudioWorklet Implementation**: Audio processing occurs on a dedicated thread to ensure timing accuracy and prevent UI blocking.
- **Dynamic Polyphony Management**: Configurable voice allocation per layer to optimize CPU usage.

### 🧠 Smart Harmony Engine (New)
A proprietary logic module for real-time music theory analysis:
- **Interval Analysis**: Detects chords based on incoming MIDI note intervals relative to the root.
- **Smart Pad Accompaniment**: Automatically generates and voices synth pads based on the detected harmonic context.
- **Configurable Detection**: Adjustable history buffer size and allowed chord qualities (Major, Minor, Diminished, Augmented, etc.).
- **Latch Mode**: Infinite sustain capability for chord holds, enabling complex performance layering.

### 🎛️ Signal Processing Chain
Each instrument layer (Piano, Synth, Bass) possesses an independent signal path:
- **3-Band Parametric EQ**: Biquad filters for precise tonal shaping (LowShelf, Peaking, HighShelf).
- **State-Variable Filter**: Single-control DJ-style filter sweeping between Low Pass (LPF) and High Pass (HPF).
- **Effects Bus**:
  - **Reverb & Chorus**: MIDI CC-controlled spatial effects.
  - **Delay Line**: Feedback delay with adjustable time and mix parameters.

## Feature Set

### Tri-Layer Split Architecture
- **Layer 1 (Piano)**: Primary melodic voice.
- **Layer 2 (Synth)**: Atmospheric layer with optional Smart Pad integration.
- **Layer 3 (Bass)**: Monophonic/Polyphonic bass section with configurable MIDI split point.

### Advanced Configuration
- **Global Settings Modal**: Centralized control for system parameters.
- **Velocity Curves**: Toggleable "No Sens" mode for fixed-velocity performance (Organ/Synth styles).
- **Long Release**: CC 72 override for extended envelope release times.

## Versioning

### v2.0.0 (Current Release)
The primary interface for the application.
- **Path**: `/`
- **Status**: Active Development
- **Key Features**: Tri-Layer Split, Smart Harmony Engine, Advanced Settings, Visual Chord Display.

### v1.0.0 (Legacy)
The original dual-layer prototype.
- **Status**: **Deprecated**
- **Note**: This version is no longer maintained and lacks the Bass layer and Smart Harmony features.

## Technical Stack

- **Frontend**: React 18
- **Build System**: Vite
- **Styling**: Tailwind CSS
- **Audio Core**: Web Audio API (AudioContext, AudioWorklet)
- **MIDI**: Web MIDI API
- **Synthesis Library**: spessasynth_lib

## Installation & Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/sf2-workstation.git
   cd sf2-workstation
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## License

This project is open source and available under the MIT License.
