# SF2 Workstation

**SF2 Workstation** is a professional web-based SoundFont player and audio workstation built with React and the Web Audio API. It allows users to load SoundFont (.sf2) files, layer instruments, apply real-time effects, and play using either an on-screen virtual keyboard or a physical MIDI controller.

You can test it here: https://gustavohubner.github.io/midi-sf2-webapp/

![SF2 Workstation](public/screenshot.png)

## Features

### 🎹 Audio Engine
- **High-Performance Synthesis**: Powered by `spessasynth_lib` and AudioWorklets for low-latency audio.
- **SoundFont Support**: Fully compatible with `.sf2` files. Comes with `GeneralUser-GS.sf2` pre-configured.
- **Polyphony**: Supports complex chords and sustained notes without dropouts.

### 🎛️ Real-Time Processing
- **3-Band Equalizer**: Dedicated Treble, Mid, and Bass controls for each instrument layer.
- **DJ-Style Filter**: Single-knob Low Pass / High Pass filter (LPF/HPF) for creative sweeps.
- **Effects Rack**:
  - **Reverb**: Add space and depth.
  - **Chorus**: Thicken the sound.
  - **Delay**: Echo effects with adjustable Mix, Time, and Feedback.

### 🎚️ Professional UI
- **Dual & Tri-Layer Modes**:
  - **Standard Mode**: Mix Piano and Synth layers.
  - **V2 Mode**: Adds a dedicated **Split Bass** layer for left-hand accompaniment.
- **Smart Sliders**: "Sticky Center" faders that snap to 50% for easy resetting.
- **Master Control**: Global volume and mix controls.

### 🔌 MIDI Integration
- **Plug & Play**: Automatically detects connected MIDI keyboards and controllers.
- **Full Control**: Supports Note On/Off, Velocity, and Sustain Pedal (CC 64).
- **Velocity Sensitivity**: Toggle "No Sens" to force max velocity for synth/organ styles.

## Versions

The application includes two distinct workstation layouts:

### 1. Standard Workstation (`/`)
- **Dual Layer**: Piano + Synth.
- **Mix Fader**: Seamlessly blend between the two layers.
- **Ideal for**: Layering pads behind pianos, strings, or brass.

### 2. Workstation V2 (`/v2`)
- **Tri-Layer Split**: Piano + Synth + **Bass**.
- **Split Point**: Configurable MIDI split point (Default: C3). Notes below this play the Bass layer.
- **Dedicated Bass Section**: Independent volume, EQ, and filter for the bass.
- **Ideal for**: Live performance, playing bass lines with the left hand and chords/melody with the right.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sf2-workstation.git
   cd sf2-workstation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

## Usage Guide

1. **Start Engine**: Click the "CLICK TO START ENGINE" button to initialize the audio context.
2. **Load Sounds**:
   - The app auto-loads `GeneralUser-GS.sf2` if available in the `public` folder.
   - Use the "Choose File" button to load your own `.sf2` files.
3. **Select Presets**: Use the dropdown or `< >` arrows to change instruments.
4. **Shape Sound**:
   - Adjust **EQ** sliders to shape the tone.
   - Use the **Filter** slider: Left for Low Pass (muffled), Right for High Pass (thin), Center for clean.
   - Enable **Long Release** for ambient pads.
5. **Play**: Use your mouse on the virtual keyboard or connect a USB MIDI keyboard.

## Technologies Used

- **React**: UI Framework.
- **Vite**: Build tool.
- **Tailwind CSS**: Styling.
- **Web Audio API**: Core audio processing.
- **spessasynth_lib**: SoundFont synthesizer library.

## License

This project is open source.
