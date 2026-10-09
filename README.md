# Street Philosophy Fighter

An offline debate-fighting prototype: Buddha versus Ayn Rand. Built with React, Linaria, TypeScript, and Phaser from the codex-react-phaser-template scaffold.

## Run

```sh
pnpm install
pnpm dev
```

Use `pnpm dev:arcade` for the RCade cabinet emulator, `pnpm build` for the production bundle, and `pnpm test` for the debate/combat checks. Node 22.18+ or 24 is recommended for the TypeScript test runner. The RCade manifest is preserved.

## Debate loop

The topic stays at the top: **Does ambition help us flourish, or make us suffer?** Each claim has a high conclusion, middle inference, and low premise. Inspect all three before choosing among three specific objections. Their strength is authored in advance and revealed through the outcome and explanation, rather than a score beside the choice.

1. Choose an objection. Its target determines an overhead strike, argument thrust, or low kick. Stronger objections deal more damage.
2. The defender has a 1.6-second attack windup to change stance and press B. A correct-zone parry in the final 0.35 seconds prevents damage. An early correct-zone guard reduces damage while held; a wrong-zone guard does not help.
3. The defender chooses a logical answer, even after a successful parry. Defending, conceding, or evading affects argument pressure and the next claim. Pressure increases damage taken in later exchanges; a sound answer or concession reduces it.
4. Read the explanation and press A to continue. Roles swap, with the next claim following the selected answer.

There is no reading countdown. The match ends at zero health or after 12 exchanges, with remaining health deciding the winner. Solo mode provides a computer opponent; two-player mode lets both players choose and defend. Response order is shuffled.

## Joystick and two buttons

- While reading: up/down selects a response, A commits, B cycles through the original claim's parts. During the answer stage, another B returns to the objection after the three parts.
- During an attack: up + B defends high, neutral + B middle, down + B low. Time B near impact for a parry.
- After the explanation: A continues.

Player 1 uses WASD or arrows, F/Z for A, G/X for B. Player 2 uses IJKL, semicolon for A, apostrophe for B. 1/Enter starts solo; 2 starts local versus; Escape pauses. Gamepads use the left stick/d-pad and buttons 0 and 1. Cabinet input comes from @rcade/plugin-input-classic. On-screen choices and guard buttons also support mouse/touch. The control guide appears before a match and while paused.

## Offline content and visuals

The current graph contains eight argument states, 24 objections, and 72 answers. All dialogue is original writing inspired by the philosophers' ideas, not historical quotations. It is stored locally, with no model calls, API keys, remote assets, or network requirement during play. Additional generated content should be reviewed and added to the same graph before deployment; preserve valid links, logical targets, strength judgments, and response continuity.

The full-window arena uses procedural Phaser characters, scenery, and attack effects. Large speech bubbles appear above the speaker. These illustrations are prototype art.

Content lives in `src/debate.ts`, debate/combat rules in `src/engine.ts`, rendering and input in `src/arena.ts`, and the fullscreen interface in `src/App.tsx`. `src/dialogue.ts` retains the original character identities and move vocabulary. Tests cover graph integrity, input, damage, parries, concessions, pressure, CPU turns, pause/restart, and match completion.
