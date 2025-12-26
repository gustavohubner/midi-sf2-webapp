import React, { useState, useEffect, useRef } from 'react';
import { WorkletSynthesizer } from 'spessasynth_lib';
import { HarmonyEngine } from '../core/harmony-engine';
import { ALL_CHORD_QUALITIES } from '../core/chord-detection';
import VirtualKeyboard from '../components/VirtualKeyboard';
import InstrumentSection from '../components/InstrumentSection';
import { Maximize, Minimize, ChevronDown, ChevronRight, Settings, X } from 'lucide-react';

function SF2WorkstationV2() {
  // Audio State
  const [pianoSynth, setPianoSynth] = useState(null);
  const [synthSynth, setSynthSynth] = useState(null);
  const [bassSynth, setBassSynth] = useState(null);
  
  const audioContextRef = useRef(null);
  const pianoGainRef = useRef(null);
  const synthGainRef = useRef(null);
  const bassGainRef = useRef(null);
  const masterGainRef = useRef(null);

  const pianoEqRefs = useRef({ low: null, mid: null, high: null });
  const synthEqRefs = useRef({ low: null, mid: null, high: null });
  const bassEqRefs = useRef({ low: null, mid: null, high: null });

  const pianoFilterRefs = useRef({ lp: null, hp: null });
  const synthFilterRefs = useRef({ lp: null, hp: null });
  const bassFilterRefs = useRef({ lp: null, hp: null });

  const pianoDelayRefs = useRef({ input: null, delay: null, feedback: null });
  const synthDelayRefs = useRef({ input: null, delay: null, feedback: null });

  // UI State
  const [pianoEnabled, setPianoEnabled] = useState(true);
  const [synthEnabled, setSynthEnabled] = useState(true);
  const [bassEnabled, setBassEnabled] = useState(true);
  
  const [mix, setMix] = useState(50); // 0 = Piano only, 100 = Synth only
  const [masterVolume, setMasterVolume] = useState(75);
  const [bassVolume, setBassVolume] = useState(75);

  // Instrument State
  const [pianoName, setPianoName] = useState('No File Loaded');
  const [synthName, setSynthName] = useState('No File Loaded');
  const [bassName, setBassName] = useState('No File Loaded');

  const [pianoPresets, setPianoPresets] = useState([]);
  const [synthPresets, setSynthPresets] = useState([]);
  const [bassPresets, setBassPresets] = useState([]);

  const [pianoPresetIndex, setPianoPresetIndex] = useState(0);
  const [synthPresetIndex, setSynthPresetIndex] = useState(0);
  const [bassPresetIndex, setBassPresetIndex] = useState(0);

  const [pianoOctave, setPianoOctave] = useState(0);
  const [synthOctave, setSynthOctave] = useState(0);
  const [bassOctave, setBassOctave] = useState(0);
  
  const [bassSplitKey, setBassSplitKey] = useState(60); // C4

  // EQ State
  const [eqValues, setEqValues] = useState({
    piano: { treble: 50, mid: 50, bass: 50, filter: 50 },
    synth: { treble: 50, mid: 50, bass: 50, filter: 50 },
    bass: { treble: 50, mid: 50, bass: 50, filter: 50 }
  });

  // Effects State
  const [effectsValues, setEffectsValues] = useState({
    piano: { reverb: 0, chorus: 0, delayTime: 0.3, delayFeedback: 0.3, delayMix: 0 },
    synth: { reverb: 0, chorus: 0, delayTime: 0.3, delayFeedback: 0.3, delayMix: 0 },
    bass: { reverb: 0, chorus: 0, delayTime: 0.3, delayFeedback: 0.3, delayMix: 0 } // Not used in UI but kept for consistency
  });

  // New Controls State
  const [pianoLongRelease, setPianoLongRelease] = useState(false);
  const [synthLongRelease, setSynthLongRelease] = useState(true);
  const [bassLongRelease, setBassLongRelease] = useState(false);

  const [pianoNoSens, setPianoNoSens] = useState(false);
  const [synthNoSens, setSynthNoSens] = useState(true);
  const [bassNoSens, setBassNoSens] = useState(false);

  const [audioStarted, setAudioStarted] = useState(false);

  // UI Toggles
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSplitBassCollapsed, setIsSplitBassCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [longReleaseValue, setLongReleaseValue] = useState(110);
  const [noSensVelocity, setNoSensVelocity] = useState(96);
  const [pianoPolyphony, setPianoPolyphony] = useState(16);
  const [synthPolyphony, setSynthPolyphony] = useState(16);
  const [bassPolyphony, setBassPolyphony] = useState(2);

  // Smart Pad State
  const harmonyEngineRef = useRef(new HarmonyEngine());
  const activeSmartPadNotesRef = useRef(new Set());
  const [smartPadEnabled, setSmartPadEnabled] = useState(false);
  const [currentChord, setCurrentChord] = useState("--");
  
  // Smart Pad Settings
  const [smartPadLatch, setSmartPadLatch] = useState(false);
  const [smartPadHistorySize, setSmartPadHistorySize] = useState(12);
  const [allowedChordQualities, setAllowedChordQualities] = useState(ALL_CHORD_QUALITIES);

  // Update Harmony Engine Config
  useEffect(() => {
      harmonyEngineRef.current.updateConfig({
          historySize: smartPadHistorySize,
          sustainTime: smartPadLatch ? 999999999 : 10000, // Infinite sustain for latch
          allowedQualities: allowedChordQualities.length === ALL_CHORD_QUALITIES.length ? null : allowedChordQualities
      });
  }, [smartPadHistorySize, smartPadLatch, allowedChordQualities]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Initialize Audio
  const startAudio = async () => {
      if (audioContextRef.current) return;

      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        await audioContextRef.current.audioWorklet.addModule(`${import.meta.env.BASE_URL}spessasynth_processor.min.js`);
        await audioContextRef.current.resume();
        
        // Create Synths
        const pSynth = new WorkletSynthesizer(audioContextRef.current);
        const sSynth = new WorkletSynthesizer(audioContextRef.current);
        const bSynth = new WorkletSynthesizer(audioContextRef.current);

        // Create Gain Nodes
        pianoGainRef.current = audioContextRef.current.createGain();
        synthGainRef.current = audioContextRef.current.createGain();
        bassGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current = audioContextRef.current.createGain();
        
        masterGainRef.current.gain.value = masterVolume / 100;
        bassGainRef.current.gain.value = bassVolume / 100;

        masterGainRef.current.connect(audioContextRef.current.destination);

        // Helper to create EQ chain
        const createEQ = (refs) => {
            const low = audioContextRef.current.createBiquadFilter();
            low.type = 'lowshelf';
            low.frequency.value = 320;
            const mid = audioContextRef.current.createBiquadFilter();
            mid.type = 'peaking';
            mid.frequency.value = 1000;
            const high = audioContextRef.current.createBiquadFilter();
            high.type = 'highshelf';
            high.frequency.value = 3200;
            refs.current = { low, mid, high };
            return { low, mid, high };
        };

        const createFilter = (refs) => {
            const lp = audioContextRef.current.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 22050;
            const hp = audioContextRef.current.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 10;
            refs.current = { lp, hp };
            return { lp, hp };
        };

        const pEQ = createEQ(pianoEqRefs);
        const pFilter = createFilter(pianoFilterRefs);
        
        const sEQ = createEQ(synthEqRefs);
        const sFilter = createFilter(synthFilterRefs);

        const bEQ = createEQ(bassEqRefs);
        const bFilter = createFilter(bassFilterRefs);

        // Create Delay Nodes for Piano
        const pDelayInput = audioContextRef.current.createGain();
        pDelayInput.gain.value = 0;
        const pDelay = audioContextRef.current.createDelay(5.0);
        pDelay.delayTime.value = 0.3;
        const pFeedback = audioContextRef.current.createGain();
        pFeedback.gain.value = 0.3;
        
        pDelayInput.connect(pDelay);
        pDelay.connect(pFeedback);
        pFeedback.connect(pDelay);
        const pDelayOutput = pDelay;
        
        pianoDelayRefs.current = { input: pDelayInput, delay: pDelay, feedback: pFeedback };

        // Create Delay Nodes for Synth
        const sDelayInput = audioContextRef.current.createGain();
        sDelayInput.gain.value = 0;
        const sDelay = audioContextRef.current.createDelay(5.0);
        sDelay.delayTime.value = 0.3;
        const sFeedback = audioContextRef.current.createGain();
        sFeedback.gain.value = 0.3;
        
        sDelayInput.connect(sDelay);
        sDelay.connect(sFeedback);
        sFeedback.connect(sDelay);
        const sDelayOutput = sDelay;
        
        synthDelayRefs.current = { input: sDelayInput, delay: sDelay, feedback: sFeedback };

        // Piano Chain
        pSynth.connect(pianoGainRef.current);
        pianoGainRef.current.connect(pEQ.low);
        pEQ.low.connect(pEQ.mid);
        pEQ.mid.connect(pEQ.high);
        pEQ.high.connect(pFilter.hp);
        pFilter.hp.connect(pFilter.lp);
        pFilter.lp.connect(masterGainRef.current);
        pFilter.lp.connect(pDelayInput);

        // Synth Chain
        sSynth.connect(synthGainRef.current);
        synthGainRef.current.connect(sEQ.low);
        sEQ.low.connect(sEQ.mid);
        sEQ.mid.connect(sEQ.high);
        sEQ.high.connect(sFilter.hp);
        sFilter.hp.connect(sFilter.lp);
        sFilter.lp.connect(masterGainRef.current);
        sFilter.lp.connect(sDelayInput);

        // Bass Chain
        bSynth.connect(bassGainRef.current);
        bassGainRef.current.connect(bEQ.low);
        bEQ.low.connect(bEQ.mid);
        bEQ.mid.connect(bEQ.high);
        bEQ.high.connect(bFilter.hp);
        bFilter.hp.connect(bFilter.lp);
        bFilter.lp.connect(masterGainRef.current);

        // Delay Outputs
        pDelayOutput.connect(masterGainRef.current);
        sDelayOutput.connect(masterGainRef.current);

        setPianoSynth(pSynth);
        setSynthSynth(sSynth);
        setBassSynth(bSynth);
        setAudioStarted(true);

        // Auto-load GeneralUser-GS.sf2
        try {
            const response = await fetch(`${import.meta.env.BASE_URL}GeneralUser-GS.sf2`);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const bufferCopy1 = buffer.slice(0); 
                const bufferCopy2 = buffer.slice(0);
                
                // Load into Piano Synth
                await pSynth.soundBankManager.addSoundBank(buffer, "main");
                const pPresets = pSynth.presetList;
                setPianoPresets(pPresets);
                setPianoName("GeneralUser-GS");
                if (pPresets.length > 0) {
                    setPianoPresetIndex(0);
                    pSynth.programChange(0, pPresets[0].program);
                    pSynth.controllerChange(0, 0, pPresets[0].bank);
                    if (pianoLongRelease) pSynth.controllerChange(0, 72, 110);
                }

                // Load into Synth Synth
                await sSynth.soundBankManager.addSoundBank(bufferCopy1, "main");
                const sPresets = sSynth.presetList;
                setSynthPresets(sPresets);
                setSynthName("GeneralUser-GS");
                if (sPresets.length > 0) {
                    const targetIndex = sPresets.length > 194 ? 194 : 0;
                    setSynthPresetIndex(targetIndex);
                    sSynth.programChange(0, sPresets[targetIndex].program);
                    sSynth.controllerChange(0, 0, sPresets[targetIndex].bank);
                    if (synthLongRelease) sSynth.controllerChange(0, 72, 110);
                }

                // Load into Bass Synth
                await bSynth.soundBankManager.addSoundBank(bufferCopy2, "main");
                const bPresets = bSynth.presetList;
                setBassPresets(bPresets);
                setBassName("GeneralUser-GS");
                if (bPresets.length > 0) {

                    const targetIndex = bPresets.length > 90 ? 90 : 0; 
                    setBassPresetIndex(targetIndex);
                    bSynth.programChange(0, bPresets[targetIndex].program);
                    bSynth.controllerChange(0, 0, bPresets[targetIndex].bank);
                    if (bassLongRelease) bSynth.controllerChange(0, 72, 110);
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
    let targetSynth;
    if (type === 'piano') targetSynth = pianoSynth;
    else if (type === 'synth') targetSynth = synthSynth;
    else targetSynth = bassSynth;
    
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
        } else if (type === 'synth') {
            setSynthPresets(allPresets);
            setSynthName(file.name.replace('.sf2', ''));
            if (allPresets.length > 0) {
                setSynthPresetIndex(0);
                const p = allPresets[0];
                targetSynth.programChange(0, p.program);
                targetSynth.controllerChange(0, 0, p.bank);
            }
        } else {
            setBassPresets(allPresets);
            setBassName(file.name.replace('.sf2', ''));
            if (allPresets.length > 0) {
                setBassPresetIndex(0);
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
      let presets, targetSynth;
      if (type === 'piano') { presets = pianoPresets; targetSynth = pianoSynth; setPianoPresetIndex(index); }
      else if (type === 'synth') { presets = synthPresets; targetSynth = synthSynth; setSynthPresetIndex(index); }
      else { presets = bassPresets; targetSynth = bassSynth; setBassPresetIndex(index); }
      
      if (!presets[index] || !targetSynth) return;
      
      const p = presets[index];
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
        let refs;
        if (target === 'piano') refs = pianoFilterRefs.current;
        else if (target === 'synth') refs = synthFilterRefs.current;
        else refs = bassFilterRefs.current;

        if (refs.lp && refs.hp) {
            if (value < 50) {
                refs.hp.frequency.value = 10;
                const normalized = value / 50; 
                const freq = 20 * Math.pow(22050/20, normalized);
                refs.lp.frequency.value = Math.max(20, freq);
            } else {
                refs.lp.frequency.value = 22050;
                const normalized = (value - 50) / 50; 
                const freq = 20 * Math.pow(22050/20, normalized);
                refs.hp.frequency.value = Math.min(22050, freq);
            }
        }
        return;
    }

    const gain = (value - 50) * 0.3; 

    let refs;
    if (target === 'piano') refs = pianoEqRefs.current;
    else if (target === 'synth') refs = synthEqRefs.current;
    else refs = bassEqRefs.current;

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
          if (targetSynth) targetSynth.controllerChange(0, 91, value);
      } else if (param === 'chorus') {
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

  useEffect(() => {
      if (bassGainRef.current) {
          bassGainRef.current.gain.value = bassEnabled ? (bassVolume / 100) : 0;
      }
  }, [bassVolume, bassEnabled]);

  // Smart Pad Helper
  const updateSynthChord = (harmonicState, velocity) => {
      if (!synthSynth || !synthEnabled) return;

      const newNotes = new Set(harmonicState.notes);
      const oldNotes = activeSmartPadNotesRef.current;
      const playVelocity = synthNoSens ? noSensVelocity : (velocity > 0 ? velocity : 100);

      // Turn off notes not in new chord
      // We need to iterate over a copy of oldNotes because we are deleting from it
      Array.from(oldNotes).forEach(n => {
          if (!newNotes.has(n)) {
              const finalNote = n + (synthOctave * 12);
              if (finalNote >= 0 && finalNote <= 127) {
                  synthSynth.noteOff(0, finalNote);
              }
              oldNotes.delete(n);
          }
      });

      // Turn on new notes
      newNotes.forEach(n => {
          if (!oldNotes.has(n)) {
              const finalNote = n + (synthOctave * 12);
              if (finalNote >= 0 && finalNote <= 127) {
                  synthSynth.noteOn(0, finalNote, playVelocity);
              }
              oldNotes.add(n);
          }
      });
  };

  // Handle Note Input
  const handleNoteOn = (note, velocity = 100) => {
    let isBassNote = false;

    // Check Split
    if (bassEnabled && note < bassSplitKey) {
        isBassNote = true;
        if (bassSynth) {
            const vel = bassNoSens ? noSensVelocity : velocity;
            const n = note + (bassOctave * 12);
            if (n >= 0 && n <= 127) bassSynth.noteOn(0, n, vel);
        }
        // Removed return to allow Smart Pad to see the note
    }

    if (!isBassNote && pianoSynth && pianoEnabled) {
        const vel = pianoNoSens ? noSensVelocity : velocity;
        const n = note + (pianoOctave * 12);
        if (n >= 0 && n <= 127) pianoSynth.noteOn(0, n, vel);
    }
    
    // Smart Pad Logic
    if (smartPadEnabled) {
        harmonyEngineRef.current.noteOn(note, velocity);
        const harmonicState = harmonyEngineRef.current.getHarmonicState();
        setCurrentChord(harmonicState.chord || "--");
        updateSynthChord(harmonicState, velocity);
    } else {
        if (!isBassNote && synthSynth && synthEnabled) {
            const vel = synthNoSens ? noSensVelocity : velocity;
            const n = note + (synthOctave * 12);
            if (n >= 0 && n <= 127) synthSynth.noteOn(0, n, vel);
        }
    }
  };

  const handleNoteOff = (note) => {
    // We send note off to all, just in case split point changed while holding note
    if (bassSynth) {
        const n = note + (bassOctave * 12);
        if (n >= 0 && n <= 127) bassSynth.noteOff(0, n);
    }
    if (pianoSynth) {
        const n = note + (pianoOctave * 12);
        if (n >= 0 && n <= 127) pianoSynth.noteOff(0, n);
    }
    
    if (smartPadEnabled) {
        harmonyEngineRef.current.noteOff(note);
        const harmonicState = harmonyEngineRef.current.getHarmonicState();
        setCurrentChord(harmonicState.chord || "--");
        updateSynthChord(harmonicState, 0);
    } else {
        if (synthSynth) {
            const n = note + (synthOctave * 12);
            if (n >= 0 && n <= 127) synthSynth.noteOff(0, n);
        }
    }
  };

  // MIDI Controller Change (Sustain, etc)
  const handleControllerChange = (cc, value) => {
      if (pianoSynth && pianoEnabled) pianoSynth.controllerChange(0, cc, value);
      if (synthSynth && synthEnabled) synthSynth.controllerChange(0, cc, value);
      if (bassSynth && bassEnabled) bassSynth.controllerChange(0, cc, value);
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
      if (pianoSynth) pianoSynth.controllerChange(0, 72, pianoLongRelease ? longReleaseValue : 64);
  }, [pianoLongRelease, pianoSynth, longReleaseValue]);

  useEffect(() => {
      if (synthSynth) synthSynth.controllerChange(0, 72, synthLongRelease ? longReleaseValue : 64);
  }, [synthLongRelease, synthSynth, longReleaseValue]);

  useEffect(() => {
      if (bassSynth) bassSynth.controllerChange(0, 72, bassLongRelease ? longReleaseValue : 64);
  }, [bassLongRelease, bassSynth, longReleaseValue]);

  // Handle Polyphony Changes
  useEffect(() => {
      if (pianoSynth) pianoSynth.setMasterParameter("voiceCap", pianoPolyphony);
  }, [pianoPolyphony, pianoSynth]);

  useEffect(() => {
      if (synthSynth) synthSynth.setMasterParameter("voiceCap", synthPolyphony);
  }, [synthPolyphony, synthSynth]);

  useEffect(() => {
      if (bassSynth) bassSynth.setMasterParameter("voiceCap", bassPolyphony);
  }, [bassPolyphony, bassSynth]);

  // Handle Smart Pad Toggle Cleanup
  useEffect(() => {
      if (!smartPadEnabled && synthSynth) {
          activeSmartPadNotesRef.current.forEach(n => {
              const finalNote = n + (synthOctave * 12);
              if (finalNote >= 0 && finalNote <= 127) {
                  synthSynth.noteOff(0, finalNote);
              }
          });
          activeSmartPadNotesRef.current.clear();
          harmonyEngineRef.current.reset();
      }
  }, [smartPadEnabled, synthSynth, synthOctave]);

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
    <div className="min-h-screen bg-gray-900 p-2 md:p-4 font-sans">
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

      <div className="max-w-6xl mx-auto">
        <header className="mb-4 relative flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white tracking-tight"><span className='text-red-500'>SF2</span> Workstation</h1>
                <p className="text-gray-500 text-sm">Tri-Layer Split Player</p>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
                 <button 
                    onClick={() => setShowKeyboard(!showKeyboard)}
                    className={`p-2 rounded-lg transition-colors ${showKeyboard ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    title={showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
                >
                    <span className="text-xl leading-none">🎹</span>
                </button>
                <button 
                    onClick={toggleFullscreen}
                    className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>
        </header>

        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Settings size={24} /> Settings
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-3">Long Release Time</h3>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" 
                                    min="64" 
                                    max="127" 
                                    value={longReleaseValue} 
                                    onChange={(e) => setLongReleaseValue(parseInt(e.target.value))}
                                    className="fader-slider flex-1"
                                />
                                <span className="text-white font-mono w-12 text-right">{longReleaseValue}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Controls the CC 72 value sent when Long Release is enabled (Default: 110).</p>
                        
                            <h3 className="text-lg font-semibold text-gray-300 mb-3 mt-6">No Sens Velocity</h3>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="127" 
                                    value={noSensVelocity} 
                                    onChange={(e) => setNoSensVelocity(parseInt(e.target.value))}
                                    className="fader-slider flex-1"
                                />
                                <span className="text-white font-mono w-12 text-right">{noSensVelocity}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Fixed velocity when "No Sens" is enabled (Default: 127).</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-3">Max Polyphony</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>Piano</span>
                                        <span>{pianoPolyphony} voices</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="200" 
                                        value={pianoPolyphony} 
                                        onChange={(e) => setPianoPolyphony(parseInt(e.target.value))}
                                        className="fader-slider w-full"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>Synth</span>
                                        <span>{synthPolyphony} voices</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="200" 
                                        value={synthPolyphony} 
                                        onChange={(e) => setSynthPolyphony(parseInt(e.target.value))}
                                        className="fader-slider w-full"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>Bass</span>
                                        <span>{bassPolyphony} voices</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="200" 
                                        value={bassPolyphony} 
                                        onChange={(e) => setBassPolyphony(parseInt(e.target.value))}
                                        className="fader-slider w-full"
                                    />
                                </div>
                            </div>
                        </div>

                    <div className="mt-8 border-t border-gray-700 pt-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            Smart Pad Settings
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-gray-300 font-semibold">Latch Mode</label>
                                    <button 
                                        onClick={() => setSmartPadLatch(!smartPadLatch)}
                                        className={`px-4 py-2 rounded font-bold text-sm transition-colors ${smartPadLatch ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                    >
                                        {smartPadLatch ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-6">Keeps the chord playing indefinitely until a new chord is detected.</p>

                                <h3 className="text-lg font-semibold text-gray-300 mb-3">History Size</h3>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="range" 
                                        min="3" 
                                        max="24" 
                                        value={smartPadHistorySize} 
                                        onChange={(e) => setSmartPadHistorySize(parseInt(e.target.value))}
                                        className="fader-slider flex-1"
                                    />
                                    <span className="text-white font-mono w-12 text-right">{smartPadHistorySize}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Number of past notes to consider for chord detection.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-300 mb-3">Allowed Chord Types</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {ALL_CHORD_QUALITIES.map(quality => (
                                        <label key={quality} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                                            <input 
                                                type="checkbox"
                                                checked={allowedChordQualities.includes(quality)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setAllowedChordQualities([...allowedChordQualities, quality]);
                                                    } else {
                                                        setAllowedChordQualities(allowedChordQualities.filter(q => q !== quality));
                                                    }
                                                }}
                                                className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                                            />
                                            {quality === "" ? "Major" : quality}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Left Column: Piano & Synth */}
            <div className="lg:col-span-2 flex flex-col">
                
                <div className="bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700 flex items-center gap-">
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
                    smartPadEnabled={smartPadEnabled}
                    setSmartPadEnabled={setSmartPadEnabled}
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

                <div className="bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700 flex items-center gap-2">
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
                    currentChord={currentChord}
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
                    smartPadEnabled={smartPadEnabled}
                    setSmartPadEnabled={setSmartPadEnabled}
                />
            </div>

            {/* Right Column: Bass Split */}
            <div className="lg:col-span-1 flex flex-col h-full">
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col" style={{ marginBottom: '0.5rem', height: isSplitBassCollapsed ? 'auto' : 'min-content' }}>
                    <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setIsSplitBassCollapsed(!isSplitBassCollapsed)}>
                        <div className="flex items-center gap-2">
                            {isSplitBassCollapsed ? <ChevronRight size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            <h2 className="text-xl font-bold text-white">Split Bass</h2>
                        </div>
                    </div>
                    
                    {!isSplitBassCollapsed && (
                    <>
                    <div className="mb-2">
                        <label className="block text-xs text-gray-400 mb-1">Split Point (MIDI Note)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={bassSplitKey} 
                                onChange={(e) => setBassSplitKey(parseInt(e.target.value))}
                                className="bg-gray-900 text-white text-sm p-2 rounded border border-gray-700 w-20"
                            />
                            <span className="text-xs text-gray-500">Default: 60 (C4)</span>
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="block text-xs text-gray-400 mb-1">Volume</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={bassVolume} 
                            onChange={(e) => setBassVolume(parseInt(e.target.value))}
                            className="fader-slider w-full"
                        />
                    </div>
                    </>
                    )}
                </div>
                <InstrumentSection 
                        title="Bass Layer" 
                        type="bass"
                        name={bassName}
                        presets={bassPresets}
                        presetIndex={bassPresetIndex}
                        enabled={bassEnabled}
                        setEnabled={setBassEnabled}
                        eq={eqValues.bass}
                        effects={effectsValues.bass}
                        onUpdateEffects={updateEffects}
                        onLoadFile={handleLoadFile}
                        onPresetChange={handlePresetChange}
                        onUpdateEQ={updateEQ}
                        longRelease={bassLongRelease}
                        setLongRelease={setBassLongRelease}
                        noSens={bassNoSens}
                        setNoSens={setBassNoSens}
                        octave={bassOctave}
                        setOctave={setBassOctave}
                        showEffects={false}
                        isCompact={true}
                    />
            </div>
        </div>

        {showKeyboard && (
            <div className="mt-8">
                <VirtualKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
            </div>
        )}
      </div>
    </div>
  );
}

export default SF2WorkstationV2;
