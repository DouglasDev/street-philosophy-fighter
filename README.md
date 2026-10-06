# Street Philosophy Fighter

A playable two-fighter prototype: Buddha versus Ayn Rand, built with React, Linaria, TypeScript, and Phaser using the codex-react-phaser-template scaffold.

## Run

```sh
pnpm install
pnpm dev
```

For the RCade cabinet emulator: `pnpm dev:arcade`. Build with `pnpm build`; verify combat with `pnpm test`. Node 22.18+ or 24 is recommended for the TypeScript test runner. The existing RCade manifest is preserved.

## Controls

Player 1: WASD or arrows to move, up to jump, down to crouch, F/Z for A (offense), G/X for B (defense). Player 2: IJKL, semicolon for A, apostrophe for B. 1/Enter starts solo; 2 starts local versus. Escape pauses. Gamepads use the left stick / d-pad and buttons 0 and 1. On-screen buttons support touch and pointer input. Cabinet controls come from @rcade/plugin-input-classic when embedded.

A: offense 1. Toward + A: offense 2. B: defense 1. Away + B: defense 2. Hold B for a basic guard. Directions are relative to the opponent. Moves trigger on the button's initial press, have a cooldown, and require release before repeating. Timed defenses grant brief immunity; guarded hits deal 20% damage. Ranged moves do 10 damage; close specials do 17 within range. A round ends at zero health or after 90 seconds, with remaining health deciding timeouts.

## Dialogue and art

Every move has five base lines plus topic-specific replies, rotated to reduce repetition. Replies reference the most recent opposing argument; the last 40 exchanges can be read below the arena. All dialogue is original writing inspired by the philosophies, not historical quotations. Gemini is not connected in this prototype. No API key or network call is required to play.

Characters, temple/city arena, and attack effects are procedurally drawn and animated in Phaser. These are stylized prototype illustrations, not finished sprite sheets. The 960×600 stage scales to browser and cabinet sizes. At cabinet heights the surrounding browser controls are hidden.

Combat rules live in src/engine.ts, move definitions and replies in src/dialogue.ts, Phaser drawing/input in src/arena.ts, and the interface in src/App.tsx. Future generated dialogue should preserve the selected move, use recent conversation context, prepare candidate replies asynchronously, and fall back to these authored lines without blocking combat. Keep provider credentials on a server.
