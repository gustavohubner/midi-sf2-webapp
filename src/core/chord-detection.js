import { midiToNoteName, getNoteIndex, NOTE_NAMES } from './music-theory';

const CHORD_DEFINITIONS = [
    // --- Hexads (6 notes) ---
    { name: "m11", intervals: [0, 2, 3, 5, 7, 10] },   // 1, b3, 5, b7, 9, 11

    // --- Pentads (5 notes) ---
    { name: "13", intervals: [0, 2, 4, 9, 10] },       // 1, 3, 13, b7, 9 (No 5th)
    { name: "M7(#11)", intervals: [0, 4, 6, 7, 11] },  // 1, 3, 5, 7, #11
    { name: "m7(11)", intervals: [0, 3, 5, 7, 10] },   // 1, b3, 5, b7, 11 (No 9)
    { name: "7b9", intervals: [0, 1, 4, 7, 10] },      // 1, b9, 3, 5, b7
    
    { name: "9", intervals: [0, 2, 4, 7, 10] },        // 1, 3, 5, b7, 9
    { name: "M9", intervals: [0, 2, 4, 7, 11] },       // 1, 3, 5, 7, 9
    { name: "m9", intervals: [0, 2, 3, 7, 10] },       // 1, b3, 5, b7, 9
    { name: "6/9", intervals: [0, 2, 4, 7, 9] },       // 1, 3, 5, 6, 9
    { name: "m6/9", intervals: [0, 2, 3, 7, 9] },      // 1, b3, 5, 6, 9

    // --- Tetrads (4 notes) ---
    { name: "11", intervals: [0, 2, 5, 10] },          // 1, b7, 9, 11 (No 3rd, No 5th)
    { name: "5(6/9)", intervals: [0, 2, 7, 9] },       // 1, 5, 6, 9
    
    { name: "add9", intervals: [0, 2, 4, 7] },         // 1, 3, 5, 9
    { name: "m(add9)", intervals: [0, 2, 3, 7] },      // 1, b3, 5, 9
    { name: "7", intervals: [0, 4, 7, 10] },
    { name: "M7", intervals: [0, 4, 7, 11] },
    { name: "m7", intervals: [0, 3, 7, 10] },
    { name: "dim7", intervals: [0, 3, 6, 9] },
    { name: "m(maj7)", intervals: [0, 3, 7, 11] },
    { name: "7sus4", intervals: [0, 5, 7, 10] },       // 1, 4, 5, b7
    { name: "6", intervals: [0, 4, 7, 9] },
    { name: "m6", intervals: [0, 3, 7, 9] },
    { name: "m7(b5)", intervals: [0, 3, 6, 10] },
    
    // --- Triads (3 notes) ---
    { name: "", intervals: [0, 4, 7] },      // Major
    { name: "m", intervals: [0, 3, 7] },     // Minor
    { name: "dim", intervals: [0, 3, 6] },   // Diminished
    { name: "aug", intervals: [0, 4, 8] },   // Augmented
    { name: "sus2", intervals: [0, 2, 7] },  // Suspended 2
    { name: "sus4", intervals: [0, 5, 7] },  // Suspended 4

    // --- Dyads (2 notes) ---
    { name: "5", intervals: [0, 7] },        // Power Chord (Root + 5th)
];

export const ALL_CHORD_QUALITIES = CHORD_DEFINITIONS.map(d => d.name);

/**
 * Detects the chord from an array of active MIDI note numbers.
 * @param {number[]} activeNotes - Sorted array of MIDI note numbers
 * @param {string[]} allowedQualities - Optional list of allowed chord qualities
 * @returns {string} The name of the chord
 */
export function detectChord(activeNotes, allowedQualities = null) {
    if (!activeNotes || activeNotes.length < 2) { // Allow 2 notes for Power Chords
        return activeNotes.length > 0 ? "..." : "--";
    }

    // 1. Get unique pitch classes (0-11) and sort them
    const uniquePitches = [...new Set(activeNotes.map(getNoteIndex))].sort((a, b) => a - b);
    
    // We need at least 2 unique pitches for a chord (Power Chord)
    if (uniquePitches.length < 2) return "Unison";

    // 2. Identify the bass note (lowest MIDI number)
    const bassMidi = activeNotes[0];
    const bassNoteIndex = getNoteIndex(bassMidi);
    const bassNoteName = NOTE_NAMES[bassNoteIndex];

    // Priority: Check if the Bass note is the Root (Root Position)
    // Then check other notes (Inversions)
    const sortedRoots = [
        bassNoteIndex, 
        ...uniquePitches.filter(n => n !== bassNoteIndex)
    ];

    // 3. Try to find a match by rotating through possible roots
    for (let root of sortedRoots) {
        const intervals = uniquePitches.map(pitch => (pitch - root + 12) % 12).sort((a, b) => a - b);
        
        const quality = identifyQuality(intervals, allowedQualities);
        
        if (quality !== null) {
            // STRICT CHECK: If there are extra notes that don't fit the quality, reject it.
            // This prevents finding "Em" inside a cluster of [E, G, B, F, A, C].
            // The identifyQuality function only checks if the *required* intervals exist.
            // We need to ensure there are no *forbidden* intervals.
            
            // Re-calculate required intervals for the detected quality
            const requiredIntervals = getIntervalsForQuality(quality);
            
            // Check if we have extra notes (noise)
            const hasNoise = intervals.some(i => !requiredIntervals.includes(i));
            
            if (!hasNoise) {
                const rootName = NOTE_NAMES[root];
                let chordName = `${rootName}${quality}`;

                // Check for inversion (Slash Chord)
                if (root !== bassNoteIndex) {
                    chordName += `/${bassNoteName}`;
                }

                return chordName;
            }
        }
    }

    return "Unknown";
}

function getIntervalsForQuality(quality) {
    const def = CHORD_DEFINITIONS.find(c => c.name === quality);
    return def ? def.intervals : [];
}

/**
 * Identifies the chord quality based on intervals from the root.
 * @param {number[]} intervals - Array of intervals (e.g., [0, 4, 7] for Major)
 * @param {string[]} allowedQualities - Optional list of allowed chord qualities
 * @returns {string|null} The quality string (e.g., "", "m", "dim") or null if not found
 */
function identifyQuality(intervals, allowedQualities) {
    const intervalSet = new Set(intervals);
    const count = intervalSet.size;

    // Find the first definition that matches ALL intervals
    // CHORD_DEFINITIONS is ordered by complexity (Tetrads -> Triads -> Dyads)
    for (const def of CHORD_DEFINITIONS) {
        // Filter by allowed qualities if provided
        if (allowedQualities && !allowedQualities.includes(def.name)) continue;

        // Optimization: Don't check tetrads if we only have 3 notes, etc.
        if (def.intervals.length > count) continue;

        const hasAll = def.intervals.every(i => intervalSet.has(i));
        if (hasAll) return def.name;
    }

    return null;
}
