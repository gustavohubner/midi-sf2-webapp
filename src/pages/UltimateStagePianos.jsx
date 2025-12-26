import React, { useState, useEffect, useRef } from 'react';
import { WorkletSynthesizer } from 'spessasynth_lib';
import VirtualKeyboard from '../components/VirtualKeyboard';
import InstrumentSection from '../components/InstrumentSection';

function UltimateStagePianos() {
  // Audio State
  const [pianoSynth, setPianoSynth] = useState(null);
  const [synthSynth, setSynthSynth] = useState(null);
  
  const audioContextRef = useRef(null);
  const pianoGainRef = useRef(null);
  const synthGainRef = useRef(null);
  const pianoEqRefs = useRef({ low: null, mid: null, high: null });
  const synthEqRefs = useRef({ low: null, mid: null, high: null });
  const pianoFilterRefs = useRef({ lp: null, hp: null });
  const synthFilterRefs = useRef({ lp: null, hp: null });
  const pianoDelayRefs = useRef({ input: null, delay: null, feedback: null });
  const synthDelayRefs = useRef({ input: null, delay: null, feedback: null });

  // UI State
  const [pianoEnabled, setPianoEnabled] = useState(true);
  const [synthEnabled, setSynthEnabled] = useState(true);
  const [mix, setMix] = useState(50); // 0 = Piano only, 100 = Synth only
  const [masterVolume, setMasterVolume] = useState(75);
  const masterGainRef = useRef(null);
  
  // Instrument State
  const [pianoName, setPianoName] = useState('No File Loaded');
  const [synthName, setSynthName] = useState('No File Loaded');
  const [pianoPresets, setPianoPresets] = useState([]);
  const [synthPresets, setSynthPresets] = useState([]);
  const [pianoPresetIndex, setPianoPresetIndex] = useState(0);
  const [synthPresetIndex, setSynthPresetIndex] = useState(0);
  const [pianoOctave, setPianoOctave] = useState(0);
  const [synthOctave, setSynthOctave] = useState(0);
  
  // EQ State
  const [eqValues, setEqValues] = useState({
    piano: { treble: 50, mid: 50, bass: 50, filter: 50 },
    synth: { treble: 50, mid: 50, bass: 50, filter: 50 }
  });

  // Effects State
  const [effectsValues, setEffectsValues] = useState({
    piano: { reverb: 0, chorus: 0, delayTime: 0.3, delayFeedback: 0.3, delayMix: 0 },
    synth: { reverb: 0, chorus: 0, delayTime: 0.3, delayFeedback: 0.3, delayMix: 0 }
  });

  // New Controls State
  const [pianoLongRelease, setPianoLongRelease] = useState(false);
  const [synthLongRelease, setSynthLongRelease] = useState(true);
  const [pianoNoSens, setPianoNoSens] = useState(false);
  const [synthNoSens, setSynthNoSens] = useState(true);

  const [audioStarted, setAudioStarted] = useState(false);

  // Initialize Audio
  const startAudio = async () => {
      if (audioContextRef.current) return;

      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        await audioContextRef.current.audioWorklet.addModule('/spessasynth_processor.min.js');
        await audioContextRef.current.resume();
        
        // Create Two Separate Synths
        const pSynth = new WorkletSynthesizer(audioContextRef.current);
        const sSynth = new WorkletSynthesizer(audioContextRef.current);

        // Create Gain Nodes
        pianoGainRef.current = audioContextRef.current.createGain();
        synthGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = masterVolume / 100;
        masterGainRef.current.connect(audioContextRef.current.destination);

        // Create EQ Nodes for Piano
        const pLow = audioContextRef.current.createBiquadFilter();
        pLow.type = 'lowshelf';
        pLow.frequency.value = 320;
        const pMid = audioContextRef.current.createBiquadFilter();
        pMid.type = 'peaking';
        pMid.frequency.value = 1000;
        const pHigh = audioContextRef.current.createBiquadFilter();
        pHigh.type = 'highshelf';
        pHigh.frequency.value = 3200;
        pianoEqRefs.current = { low: pLow, mid: pMid, high: pHigh };

        // Create Filter Nodes for Piano (DJ Filter)
        const pFilterLP = audioContextRef.current.createBiquadFilter();
        pFilterLP.type = 'lowpass';
        pFilterLP.frequency.value = 22050; // Open
        const pFilterHP = audioContextRef.current.createBiquadFilter();
        pFilterHP.type = 'highpass';
        pFilterHP.frequency.value = 10; // Open
        pianoFilterRefs.current = { lp: pFilterLP, hp: pFilterHP };

        // Create EQ Nodes for Synth
        const sLow = audioContextRef.current.createBiquadFilter();
        sLow.type = 'lowshelf';
        sLow.frequency.value = 320;
        const sMid = audioContextRef.current.createBiquadFilter();
        sMid.type = 'peaking';
        sMid.frequency.value = 1000;
        const sHigh = audioContextRef.current.createBiquadFilter();
        sHigh.type = 'highshelf';
        sHigh.frequency.value = 3200;
        synthEqRefs.current = { low: sLow, mid: sMid, high: sHigh };

        // Create Filter Nodes for Synth (DJ Filter)
        const sFilterLP = audioContextRef.current.createBiquadFilter();
        sFilterLP.type = 'lowpass';
        sFilterLP.frequency.value = 22050; // Open
        const sFilterHP = audioContextRef.current.createBiquadFilter();
        sFilterHP.type = 'highpass';
        sFilterHP.frequency.value = 10; // Open
        synthFilterRefs.current = { lp: sFilterLP, hp: sFilterHP };

        // Create Delay Nodes for Piano
        const pDelayInput = audioContextRef.current.createGain();
        pDelayInput.gain.value = 0;
        const pDelay = audioContextRef.current.createDelay(5.0);
        pDelay.delayTime.value = 0.3;
        const pFeedback = audioContextRef.current.createGain();
        pFeedback.gain.value = 0.3;
        
        pDelayInput.connect(pDelay);
        // pDelay.connect(audioContextRef.current.destination); // Removed direct connection
        pDelay.connect(pFeedback);
        pFeedback.connect(pDelay);
        const pDelayOutput = pDelay; // Store for later connection
        
        pianoDelayRefs.current = { input: pDelayInput, delay: pDelay, feedback: pFeedback };

        // Create Delay Nodes for Synth
        const sDelayInput = audioContextRef.current.createGain();
        sDelayInput.gain.value = 0;
        const sDelay = audioContextRef.current.createDelay(5.0);
        sDelay.delayTime.value = 0.3;
        const sFeedback = audioContextRef.current.createGain();
        sFeedback.gain.value = 0.3;
        
        sDelayInput.connect(sDelay);
        // sDelay.connect(audioContextRef.current.destination); // Removed direct connection
        sDelay.connect(sFeedback);
        sFeedback.connect(sDelay);
        const sDelayOutput = sDelay; // Store for later connection
        
        synthDelayRefs.current = { input: sDelayInput, delay: sDelay, feedback: sFeedback };

        // Chain: Synth -> Gain -> EQ -> Destination
        
        // Piano Chain
        pSynth.connect(pianoGainRef.current);
        pianoGainRef.current.connect(pLow);
        pLow.connect(pMid);
        pMid.connect(pHigh);
        pHigh.connect(pFilterHP);
        pFilterHP.connect(pFilterLP);
        pFilterLP.connect(masterGainRef.current);
        pFilterLP.connect(pDelayInput);

        // Synth Chain
        sSynth.connect(synthGainRef.current);
        synthGainRef.current.connect(sLow);
        sLow.connect(sMid);
        sMid.connect(sHigh);
        sHigh.connect(sFilterHP);
        sFilterHP.connect(sFilterLP);
        sFilterLP.connect(masterGainRef.current);
        sFilterLP.connect(sDelayInput);

        // Delay Outputs
        pDelayOutput.connect(masterGainRef.current);
        sDelayOutput.connect(masterGainRef.current);

        setPianoSynth(pSynth);
        setSynthSynth(sSynth);
        setAudioStarted(true);

        // Auto-load GeneralUser-GS.sf2
        try {
            const response = await fetch('/GeneralUser-GS.sf2');
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const bufferCopy = buffer.slice(0); // Clone for the second synth
                
                // Load into Piano Synth
                await pSynth.soundBankManager.addSoundBank(buffer, "main");
                const pPresets = pSynth.presetList;
                setPianoPresets(pPresets);
                setPianoName("GeneralUser-GS");
                if (pPresets.length > 0) {
                    setPianoPresetIndex(0);
                    pSynth.programChange(0, pPresets[0].program);
                    pSynth.controllerChange(0, 0, pPresets[0].bank);
                    // Apply default Long Release
                    if (pianoLongRelease) pSynth.controllerChange(0, 72, 110);
                }

                // Load into Synth Synth
                await sSynth.soundBankManager.addSoundBank(bufferCopy, "main");
                const sPresets = sSynth.presetList;
                setSynthPresets(sPresets);
                setSynthName("GeneralUser-GS");
                if (sPresets.length > 0) {
                    const targetIndex = sPresets.length > 194 ? 194 : 0;
                    setSynthPresetIndex(targetIndex);
                    sSynth.programChange(0, sPresets[targetIndex].program);
                    sSynth.controllerChange(0, 0, sPresets[targetIndex].bank);
                    // Apply default Long Release
                    if (synthLongRelease) sSynth.controllerChange(0, 72, 110);
                }
            }
        } catch (err) {
            console.warn("Auto-load failed:", err);
        }

      } catch (e) {
          console.error("Audio Init Error:", e);
          alert("Failed to initialize audio. Please reload.");
      }
  };

  // Handle File Loading
  const handleLoadFile = async (e, type) => {
    const file = e.target.files[0];
    const targetSynth = type === 'piano' ? pianoSynth : synthSynth;
    
    if (!file || !targetSynth) return;

    try {
        const buffer = await file.arrayBuffer();
        
        try {
             await targetSynth.soundBankManager.deleteSoundBank("main");
        } catch(e) {}

        await targetSynth.soundBankManager.addSoundBank(buffer, "main"); 
        
        const allPresets = targetSynth.presetList;
        
        if (type === 'piano') {
            setPianoPresets(allPresets);
            setPianoName(file.name.replace('.sf2', ''));
            if (allPresets.length > 0) {
                setPianoPresetIndex(0);
                const p = allPresets[0];
                targetSynth.programChange(0, p.program);
                targetSynth.controllerChange(0, 0, p.bank);
            }
        } else {
            setSynthPresets(allPresets);
            setSynthName(file.name.replace('.sf2', ''));
            if (allPresets.length > 0) {
                setSynthPresetIndex(0);
                const p = allPresets[0];
                targetSynth.programChange(0, p.program);
                targetSynth.controllerChange(0, 0, p.bank);
            }
        }

    } catch (err) {
        console.error(err);
        alert("Error loading file");
    }
  };

  const handlePresetChange = (type, index) => {
      const presets = type === 'piano' ? pianoPresets : synthPresets;
      const targetSynth = type === 'piano' ? pianoSynth : synthSynth;
      
      if (!presets[index] || !targetSynth) return;
      
      const p = presets[index];
      
      if (type === 'piano') setPianoPresetIndex(index);
      else setSynthPresetIndex(index);
      
      // Always channel 0 for the isolated synth
      targetSynth.controllerChange(0, 0, p.bank); 
      targetSynth.programChange(0, p.program);
  };

  // Handle EQ Changes
  const updateEQ = (target, band, value) => {
    setEqValues(prev => ({
        ...prev,
        [target]: { ...prev[target], [band]: value }
    }));

    if (band === 'filter') {
        const refs = target === 'piano' ? pianoFilterRefs.current : synthFilterRefs.current;
        if (refs.lp && refs.hp) {
            // DJ Filter Logic
            // Value 0-50: Low Pass (20Hz to 22kHz)
            // Value 50-100: High Pass (20Hz to 22kHz)
            
            if (value < 50) {
                // Low Pass Mode
                // HP Open (10Hz)
                refs.hp.frequency.value = 10;
                
                // LP Closing (22kHz -> 20Hz)
                // Map 50->0 to 22050->20
                // Using exponential scale for better feel
                const normalized = value / 50; // 1.0 to 0.0
                const freq = 20 * Math.pow(22050/20, normalized);
                refs.lp.frequency.value = Math.max(20, freq);
            } else {
                // High Pass Mode
                // LP Open (22kHz)
                refs.lp.frequency.value = 22050;
                
                // HP Opening (20Hz -> 22kHz)
                // Map 50->100 to 20->22050
                const normalized = (value - 50) / 50; // 0.0 to 1.0
                const freq = 20 * Math.pow(22050/20, normalized);
                refs.hp.frequency.value = Math.min(22050, freq);
            }
        }
        return;
    }

    const gain = (value - 50) * 0.3; // +/- 15dB

    const refs = target === 'piano' ? pianoEqRefs.current : synthEqRefs.current;
    if (refs.low && refs.mid && refs.high) {
        if (band === 'bass') refs.low.gain.value = gain;
        if (band === 'mid') refs.mid.gain.value = gain;
        if (band === 'treble') refs.high.gain.value = gain;
    }
  };

  // Handle Effects Changes
  const updateEffects = (target, param, value) => {
      setEffectsValues(prev => ({
          ...prev,
          [target]: { ...prev[target], [param]: value }
      }));

      const targetSynth = target === 'piano' ? pianoSynth : synthSynth;
      const delayRefs = target === 'piano' ? pianoDelayRefs.current : synthDelayRefs.current;

      if (param === 'reverb') {
          // CC 91
          if (targetSynth) targetSynth.controllerChange(0, 91, value);
      } else if (param === 'chorus') {
          // CC 93
          if (targetSynth) targetSynth.controllerChange(0, 93, value);
      } else if (param === 'delayMix') {
          if (delayRefs.input) delayRefs.input.gain.value = value / 100;
      } else if (param === 'delayTime') {
          if (delayRefs.delay) delayRefs.delay.delayTime.value = value;
      } else if (param === 'delayFeedback') {
          if (delayRefs.feedback) delayRefs.feedback.gain.value = value;
      }
  };

  // Handle Mix / Volume
  useEffect(() => {
    if (!pianoGainRef.current || !synthGainRef.current) return;
    
    let pVol = 1;
    let sVol = 1;
    
    if (mix < 50) {
        sVol = mix / 50;
    } else {
        pVol = 1 - ((mix - 50) / 50);
    }

    if (!pianoEnabled) pVol = 0;
    if (!synthEnabled) sVol = 0;

    pianoGainRef.current.gain.value = pVol;
    synthGainRef.current.gain.value = sVol;

  }, [mix, pianoEnabled, synthEnabled]);

  // Handle Note Input
  const handleNoteOn = (note, velocity = 100) => {
    if (pianoSynth && pianoEnabled) {
        const vel = pianoNoSens ? 127 : velocity;
        const n = note + (pianoOctave * 12);
        if (n >= 0 && n <= 127) pianoSynth.noteOn(0, n, vel);
    }
    if (synthSynth && synthEnabled) {
        const vel = synthNoSens ? 127 : velocity;
        const n = note + (synthOctave * 12);
        if (n >= 0 && n <= 127) synthSynth.noteOn(0, n, vel);
    }
  };

  const handleNoteOff = (note) => {
    if (pianoSynth) {
        const n = note + (pianoOctave * 12);
        if (n >= 0 && n <= 127) pianoSynth.noteOff(0, n);
    }
    if (synthSynth) {
        const n = note + (synthOctave * 12);
        if (n >= 0 && n <= 127) synthSynth.noteOff(0, n);
    }
  };

  // MIDI Controller Change (Sustain, etc)
  const handleControllerChange = (cc, value) => {
      if (pianoSynth && pianoEnabled) pianoSynth.controllerChange(0, cc, value);
      if (synthSynth && synthEnabled) synthSynth.controllerChange(0, cc, value);
  };

  // MIDI Refs
  const noteOnRef = useRef(handleNoteOn);
  const noteOffRef = useRef(handleNoteOff);
  const ccRef = useRef(handleControllerChange);

  useEffect(() => {
      noteOnRef.current = handleNoteOn;
      noteOffRef.current = handleNoteOff;
      ccRef.current = handleControllerChange;
  });

  // MIDI Initialization
  useEffect(() => {
      if (!navigator.requestMIDIAccess) return;

      const onMIDIMessage = (event) => {
          const [status, data1, data2] = event.data;
          const command = status & 0xF0;
          
          if (command === 0x90 && data2 > 0) {
              noteOnRef.current(data1, data2);
          } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
              noteOffRef.current(data1);
          } else if (command === 0xB0) {
              ccRef.current(data1, data2);
          }
      };

      navigator.requestMIDIAccess().then((midiAccess) => {
          for (const input of midiAccess.inputs.values()) {
              input.onmidimessage = onMIDIMessage;
          }
          midiAccess.onstatechange = (e) => {
              if (e.port.type === 'input' && e.port.state === 'connected') {
                  e.port.onmidimessage = onMIDIMessage;
              }
          };
      }, () => console.log("MIDI Access denied"));
  }, []);

  // Handle Master Volume
  useEffect(() => {
      if (masterGainRef.current) {
          masterGainRef.current.gain.value = masterVolume / 100;
      }
  }, [masterVolume]);

  // Handle Long Release Toggle
  useEffect(() => {
      if (pianoSynth) {
          // CC 72 is Release Time. 64 is default. 100+ is long.
          pianoSynth.controllerChange(0, 72, pianoLongRelease ? 110 : 64);
      }
  }, [pianoLongRelease, pianoSynth]);

  useEffect(() => {
      if (synthSynth) {
          synthSynth.controllerChange(0, 72, synthLongRelease ? 110 : 64);
      }
  }, [synthLongRelease, synthSynth]);

    // Helper for "Sticky 50" slider
    const fromSliderValue = (val) => {
        val = parseInt(val);
        if (val <= 50) return val;
        if (val <= 60) return 50;
        return val - 10;
    };

    const toSliderValue = (val) => {
        if (val < 50) return val;
        if (val === 50) return 55;
        return val + 10;
    };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans">
      {!audioStarted ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <button 
                onClick={startAudio}
                className="px-8 py-6 bg-red-600 text-white text-2xl font-bold rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:bg-red-500 hover:scale-105 transition-all animate-pulse"
              >
                  CLICK TO START ENGINE
              </button>
          </div>
      ) : null}



      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Ultimate Stage Pianos <span className="text-red-500 text-sm align-top">LITE</span></h1>
            <p className="text-gray-500 text-sm">Dual Layer SoundFont Player</p>
        </header>

        <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700 flex items-center gap-4">
          <span className="text-sm font-bold text-gray-400 w-16">MASTER</span>
          <input 
              type="range" 
              min="0" 
              max="100" 
              value={masterVolume} 
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
              className="fader-slider flex-1"
          />
          <span className="text-sm font-bold text-gray-400 w-8 text-right">{masterVolume}%</span>
        </div>

        <InstrumentSection 
            title="Layer 1: Piano" 
            type="piano"
            name={pianoName}
            presets={pianoPresets}
            presetIndex={pianoPresetIndex}
            enabled={pianoEnabled}
            setEnabled={setPianoEnabled}
            eq={eqValues.piano}
            effects={effectsValues.piano}
            onUpdateEffects={updateEffects}
            onLoadFile={handleLoadFile}
            onPresetChange={handlePresetChange}
            onUpdateEQ={updateEQ}
            longRelease={pianoLongRelease}
            setLongRelease={setPianoLongRelease}
            noSens={pianoNoSens}
            setNoSens={setPianoNoSens}
            octave={pianoOctave}
            setOctave={setPianoOctave}
        />

        <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700 flex items-center gap-4">
            <span className="text-sm font-bold text-gray-400">PIANO</span>
            <input 
                type="range" 
                min="0" 
                max="110" 
                value={toSliderValue(mix)} 
                onChange={(e) => setMix(fromSliderValue(e.target.value))}
                className="fader-slider flex-1"
            />
            <span className="text-sm font-bold text-gray-400">SYNTH</span>
        </div>



        <InstrumentSection 
            title="Layer 2: Synth" 
            type="synth"
            name={synthName}
            presets={synthPresets}
            presetIndex={synthPresetIndex}
            enabled={synthEnabled}
            setEnabled={setSynthEnabled}
            eq={eqValues.synth}
            effects={effectsValues.synth}
            onUpdateEffects={updateEffects}
            onLoadFile={handleLoadFile}
            onPresetChange={handlePresetChange}
            onUpdateEQ={updateEQ}
            longRelease={synthLongRelease}
            setLongRelease={setSynthLongRelease}
            noSens={synthNoSens}
            setNoSens={setSynthNoSens}
            octave={synthOctave}
            setOctave={setSynthOctave}
        />

        <div className="mt-8">
            <VirtualKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
        </div>
      </div>
    </div>
  );
}

export default UltimateStagePianos;
