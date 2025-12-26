# Musical MIDI App - Copilot Instructions

## Architecture & Organization
- **Framework**: React + Vite.
- **Styling**: Tailwind CSS.
- **Structure**:
    - `src/core`: Pure logic (Music Theory). NO React dependencies.
    - `src/services`: Browser APIs (MIDI, Audio). Singleton patterns.
    - `src/hooks`: Bridges between Services/Core and React Components.
    - `src/components`: Presentational UI only.

## Coding Standards
- **React**: Functional components + Hooks only.
- **State**: Use `useState`/`useReducer` or Context. Avoid global window state.
- **Tailwind**: Use utility classes for styling.
- **ES Modules**: Use `import`/`export`.

## Domain Specifics (Music/MIDI)
- **Core Logic (`src/core`)**: Must be pure functions/classes.
    - *Example*: `ChordDetector` returns a string, it does NOT update the DOM.
- **Services (`src/services`)**: Wrap Web MIDI/Audio APIs.
    - Use `EventEmitter` pattern or Observables to push data to Hooks.
- **Performance**: Avoid re-renders on high-frequency MIDI events. Use `useRef` for mutable audio state if necessary.

## Workflow
- **Refactoring**: Do not implement temporary fixes. Refactor properly if needed.
- **Context**: Read `DEVELOPMENT_GUIDELINES.md` before creating new modules.

## Documentation & Logging
- **Activity Log**: Always update `ACTIVITY_LOG.md` after completing a significant feature or task.
    - Mark completed items in the "Histórico de Desenvolvimento" section.
    - Add new items to "Próximos Passos" if the user requests new features or if technical debt is identified.
    - Keep the log in Portuguese as per the user's preference.
