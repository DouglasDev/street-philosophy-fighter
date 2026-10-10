# Street Philosophy Fighter

An offline debate-fighting prototype: Buddha versus Ayn Rand. Built with React, Linaria, TypeScript, and Phaser from the codex-react-phaser-template scaffold.

## Run

```sh
pnpm install
pnpm dev
```

Use `pnpm dev:arcade` for the RCade cabinet emulator, `pnpm build` for the production bundle, and `pnpm test` for the debate/combat checks. Node 22.18+ or 24 is recommended for the TypeScript test runner. The RCade manifest is preserved.

## Cabinet resolution and laptop preview

Phaser and the HTML game interface use a fixed **336 × 262** logical viewport, matching RCade's emulator. Opening the game directly on a laptop shows the same viewport enlarged up to 2×, centered with letterboxing. The preview runs inside a fixed-size iframe so media queries, text wrapping, and speech bubbles behave at cabinet resolution rather than at laptop resolution. Click inside it to use keyboard controls. Resize the laptop window without changing the game's logical dimensions.

The cabinet loads the game directly and uses its input plugin. The laptop preview uses keyboard/gamepad controls. The scenery is a bundled SVG image behind a transparent Canvas, rendered by the browser independently of Phaser and without GPU requirements or remote requests. It is brighter at cabinet resolution; reading phases hide it to keep the choices clear.

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

The full-window arena uses procedural Phaser characters and attack effects over bundled scenery. Reading and feedback screens show one speaking fighter beside a statement and response panel. Health bars and the topic are hidden while choosing. Combat uses larger fighters, small health bars, and a single compact zone/timing/button prompt; impact feedback is one short label. Start, pause, and finished screens have their own compact menus. These illustrations are prototype art.

Content lives in `src/debate.ts`, debate/combat rules in `src/engine.ts`, rendering and input in `src/arena.ts`, and the phase-specific interface in `src/GameScreen.tsx`, mounted by `src/App.tsx`. `src/dialogue.ts` retains the original character identities and move vocabulary. Tests cover graph integrity, input, damage, parries, concessions, pressure, CPU turns, pause/restart, and match completion.

## Cabinet layout verification

In development, `?layout-check=1` renders 206 fixed-size cases covering every claim part, objection, answer, concession/defense/evasion outcome, start/pause/result menu, attack zone, parry prompt, and impact result. Each panel is 336 × 262. Browser geometry checks verify that regions stay inside their panel, text fits its buttons, and unrelated regions do not overlap. These test views are excluded from production.

Use `?layout-case=select`, `answer`, `continue`, `windup`, `impact`, `ready`, `paused`, or `finished` to inspect a frozen real-match state with Phaser visuals in the laptop preview. Optional `node`, `choice`, `zone`, `answer`, and `defense` parameters select specific content.

Latest verification: all 206 layouts had zero overlaps or clipped text; start, pause, result, long-answer, outcome, attack, and impact screens were also inspected visually at cabinet resolution.

The background rendering follows [RCade’s sandbox documentation](https://github.com/fcjr/RCade#the-sandbox-what-your-game-can-and-cant-do): images must be bundled, and Canvas is supported. Production checks use the cabinet CSP, disabled storage, blocked document input events, and sandboxed iframe at 336 × 262. Physical cabinet confirmation still requires running the deployed version on the machine.
