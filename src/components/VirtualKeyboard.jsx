import React from 'react';

const VirtualKeyboard = ({ onNoteOn, onNoteOff }) => {
  const keys = [
    { note: 60, name: 'C4', type: 'white' },
    { note: 61, name: 'C#4', type: 'black' },
    { note: 62, name: 'D4', type: 'white' },
    { note: 63, name: 'D#4', type: 'black' },
    { note: 64, name: 'E4', type: 'white' },
    { note: 65, name: 'F4', type: 'white' },
    { note: 66, name: 'F#4', type: 'black' },
    { note: 67, name: 'G4', type: 'white' },
    { note: 68, name: 'G#4', type: 'black' },
    { note: 69, name: 'A4', type: 'white' },
    { note: 70, name: 'A#4', type: 'black' },
    { note: 71, name: 'B4', type: 'white' },
    { note: 72, name: 'C5', type: 'white' },
    { note: 73, name: 'C#5', type: 'black' },
    { note: 74, name: 'D5', type: 'white' },
    { note: 75, name: 'D#5', type: 'black' },
    { note: 76, name: 'E5', type: 'white' },
    { note: 77, name: 'F5', type: 'white' },
    { note: 78, name: 'F#5', type: 'black' },
    { note: 79, name: 'G5', type: 'white' },
    { note: 80, name: 'G#5', type: 'black' },
    { note: 81, name: 'A5', type: 'white' },
    { note: 82, name: 'A#5', type: 'black' },
    { note: 83, name: 'B5', type: 'white' },
    { note: 84, name: 'C6', type: 'white' },
  ];

  return (
    <div className="flex justify-center items-start select-none p-4 bg-gray-900 rounded-lg overflow-x-auto">
      <div className="relative flex h-40">
        {keys.map((key) => (
          <div
            key={key.note}
            className={`
              relative flex-shrink-0 border border-black rounded-b-md cursor-pointer
              ${key.type === 'white' 
                ? 'w-12 h-40 bg-white hover:bg-gray-100 active:bg-gray-300 z-0 text-black' 
                : 'w-8 h-24 bg-black hover:bg-gray-800 active:bg-gray-700 z-10 -mx-4 text-white'}
            `}
            onMouseDown={() => onNoteOn(key.note)}
            onMouseUp={() => onNoteOff(key.note)}
            onMouseLeave={() => onNoteOff(key.note)}
            onTouchStart={(e) => { e.preventDefault(); onNoteOn(key.note); }}
            onTouchEnd={(e) => { e.preventDefault(); onNoteOff(key.note); }}
          >
            <span className="absolute bottom-2 w-full text-center text-xs pointer-events-none">
              {key.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
