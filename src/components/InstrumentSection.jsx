import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

const InstrumentSection = ({ 
    title, 
    type, 
    name, 
    presets, 
    presetIndex, 
    enabled, 
    setEnabled, 
    eq, 
    effects, 
    onUpdateEffects,
    onLoadFile,
    onPresetChange,
    onUpdateEQ,
    longRelease,
    setLongRelease,
    noSens,
    setNoSens,
    octave,
    setOctave,
    showEffects = true,
    isCompact = false
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handlePrevPreset = () => {
        if (presets.length === 0) return;
        const newIndex = presetIndex - 1;
        if (newIndex >= 0) onPresetChange(type, newIndex);
    };

    const handleNextPreset = () => {
        if (presets.length === 0) return;
        const newIndex = presetIndex + 1;
        if (newIndex < presets.length) onPresetChange(type, newIndex);
    };

    // Helper for "Sticky 50" slider
    // Maps 0-110 slider range to 0-100 value with a dead zone at 50-60 mapping to 50
    const fromSliderValue = (val) => {
        val = parseInt(val);
        if (val <= 50) return val;
        if (val <= 60) return 50;
        return val - 10;
    };

    const toSliderValue = (val) => {
        if (val < 50) return val;
        if (val === 50) return 55; // Center of the 50-60 range
        return val + 10;
    };

    return (
    <div className={`bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700`} style={isCompact ? { height: 'inherit' } : {}}>
      <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-2">
            {isCollapsed ? <ChevronRight size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center bg-gray-900 rounded border border-gray-700">
                <button 
                    onClick={() => setOctave(octave - 1)}
                    className="px-2 py-1 hover:bg-gray-700 text-xs text-gray-400"
                >
                    <ChevronLeft size={12} />
                </button>
                <span className="text-xs font-mono w-6 text-center text-gray-300">
                    {octave > 0 ? `+${octave}` : octave}
                </span>
                <button 
                    onClick={() => setOctave(octave + 1)}
                    className="px-2 py-1 hover:bg-gray-700 text-xs text-gray-400"
                >
                    <ChevronRight size={12} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <button 
                    onClick={() => setEnabled(!enabled)}
                    className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                >
                    {enabled ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>
      </div>

      {!isCollapsed && (
      <div className={`grid gap-4 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`} >
        <div className="flex flex-col h-full">
            <label className="block text-xs text-gray-400 mb-1">SoundFont File</label>
            <div className="flex gap-2 mb-2">
                <input 
                    type="file" 
                    accept=".sf2"
                    onChange={(e) => onLoadFile(e, type)}
                    className="text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                />
            </div>
            <div className="text-xs text-gray-500 mb-4 font-mono" style={isCompact ? { marginBottom: '2.9rem' } : {}}>{name}</div>

            <label className="block text-xs text-gray-400 mb-1 mt-auto">Preset</label>
            <div className="flex items-center gap-2 mb-4">
                <button 
                    onClick={handlePrevPreset}
                    disabled={presetIndex <= 0 || presets.length === 0}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>
                <select 
                    className="flex-1 bg-gray-900 text-white text-sm p-2 rounded border border-gray-700"
                    value={presetIndex}
                    onChange={(e) => onPresetChange(type, parseInt(e.target.value))}
                    disabled={presets.length === 0}
                    // width = 1rem
                    style={{ width: '1rem'}}
                >
                    {presets.length === 0 && <option>No presets loaded</option>}
                    {presets.map((p, i) => (
                        <option key={i} value={i}>
                            {String(i + 1).padStart(3, '0')} - {p.name || p.presetName || `Preset ${p.program}`}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={handleNextPreset}
                    disabled={presetIndex >= presets.length - 1 || presets.length === 0}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => setLongRelease(!longRelease)}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${longRelease ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                    Long Release
                </button>
                <button 
                    onClick={() => setNoSens(!noSens)}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${noSens ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                    No Sens
                </button>
            </div>
        </div>

        <div className="bg-gray-900 p-3 rounded" style={{ height: 'min-content' }}>
            <h3 className="text-xs text-gray-400 uppercase mb-2 font-bold">Equalizer</h3>
            <div className="space-y-3">
                {['treble', 'mid', 'bass'].map(band => (
                    <div key={band} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-10 capitalize">{band}</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="110" 
                            value={toSliderValue(eq[band])} 
                            onChange={(e) => onUpdateEQ(type, band, fromSliderValue(e.target.value))}
                            className="fader-slider sm flex-1"
                        />
                        <span className="text-xs text-gray-500 w-6 text-right">{eq[band]}</span>
                    </div>
                ))}
                
                <div className="border-t border-gray-800 pt-2 mt-2" style={{ paddingTop: '1.3rem' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-10">Filter</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="110" 
                            value={toSliderValue(eq.filter)} 
                            onChange={(e) => onUpdateEQ(type, 'filter', fromSliderValue(e.target.value))}
                            className="fader-slider sm flex-1"
                        />
                        <span className="text-xs text-gray-500 w-6 text-right">{eq.filter}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 px-12 mt-1">
                        <span>LP</span>
                        <span>HP</span>
                    </div>
                </div>
            </div>
        </div>

        {showEffects && (
        <div className="bg-gray-900 p-3 rounded">
            <h3 className="text-xs text-gray-400 uppercase mb-2 font-bold">Effects</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">Reverb</span>
                    <input 
                        type="range" min="0" max="127" value={effects.reverb} 
                        onChange={(e) => onUpdateEffects(type, 'reverb', parseInt(e.target.value))}
                        className="fader-slider sm flex-1"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">Chorus</span>
                    <input 
                        type="range" min="0" max="127" value={effects.chorus} 
                        onChange={(e) => onUpdateEffects(type, 'chorus', parseInt(e.target.value))}
                        className="fader-slider sm flex-1"
                    />
                </div>
                <div className="border-t border-gray-800 my-2 pt-2">
                    <div className="text-xs text-gray-500 mb-1">Delay</div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-600 w-8">Mix</span>
                        <input 
                            type="range" min="0" max="100" value={effects.delayMix} 
                            onChange={(e) => onUpdateEffects(type, 'delayMix', parseInt(e.target.value))}
                            className="fader-slider sm flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-600 w-8">Time</span>
                        <input 
                            type="range" min="0" max="1" step="0.01" value={effects.delayTime} 
                            onChange={(e) => onUpdateEffects(type, 'delayTime', parseFloat(e.target.value))}
                            className="fader-slider sm flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-8">Fdbk</span>
                        <input 
                            type="range" min="0" max="0.9" step="0.01" value={effects.delayFeedback} 
                            onChange={(e) => onUpdateEffects(type, 'delayFeedback', parseFloat(e.target.value))}
                            className="fader-slider sm flex-1"
                        />
                    </div>
                </div>
            </div>
        </div>
        )}
      </div>
      )}
    </div>
    );
};

export default InstrumentSection;