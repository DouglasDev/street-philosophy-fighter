import { useEffect, useRef, useState } from "react";
import { styled } from "@linaria/react";
import * as Phaser from "phaser";
import { Arena, controls, releaseControls } from "./arena";
import { MOVES, ROSTER } from "./dialogue";
import type { Line } from "./dialogue";
import type { Match, Phase } from "./engine";

const Stage = styled.main`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #152932;
  canvas {
    display: block;
  }
`;
const Canvas = styled.div`
  position: absolute;
  inset: 0;
`;
const Hud = styled.div`
  position: absolute;
  left: 3%;
  right: 3%;
  top: 3%;
  display: grid;
  grid-template-columns: 1fr 70px 1fr;
  gap: 24px;
  pointer-events: none;
  @media (max-width: 500px) {
    gap: 10px;
    grid-template-columns: 1fr 35px 1fr;
  }
`;
const FighterHud = styled.div`
  h2 {
    margin: 0 0 7px;
    font-family: Georgia, serif;
    font-weight: normal;
    font-size: clamp(17px, 2.5vw, 32px);
    color: var(--fighter-color);
  }
  small {
    font-size: clamp(8px, 1vw, 11px);
    letter-spacing: 0.12em;
    color: #a1b4a8;
  }
  progress {
    appearance: none;
    display: block;
    width: 100%;
    height: 10px;
    border: 1px solid #486052;
    background: #111e23;
    margin: 10px 0 0;
  }
  progress::-webkit-progress-bar {
    background: #111e23;
  }
  progress::-webkit-progress-value {
    background: var(--fighter-color);
  }
  progress::-moz-progress-bar {
    background: var(--fighter-color);
  }
  @media (max-width: 500px) {
    h2 {
      margin-bottom: 3px;
    }
    progress {
      height: 6px;
      margin-top: 5px;
    }
    small {
      letter-spacing: 0.03em;
    }
  }
`;
const Timer = styled.div`
  text-align: center;
  color: #e7dab9;
  font-family: Georgia, serif;
  font-size: clamp(24px, 4vw, 45px);
`;
const Speech = styled.div`
  position: absolute;
  width: min(480px, 64vw);
  padding: 20px 25px;
  border: 2px solid var(--fighter-color);
  border-radius: 24px;
  background: #f5ecd7;
  box-shadow: 0 10px 40px #0005;
  color: #19282b;
  pointer-events: none;
  z-index: 2;
  transition:
    left 70ms linear,
    top 70ms linear;
  font-family: Georgia, serif;
  font-size: clamp(18px, 2.5vw, 32px);
  font-weight: 500;
  line-height: 1.3;
  text-align: center;
  &:before {
    content: "";
    position: absolute;
    left: var(--tail-x);
    bottom: -17px;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-top: 17px solid var(--fighter-color);
  }
  &:after {
    content: "";
    position: absolute;
    left: var(--tail-x);
    bottom: -13px;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 11px solid transparent;
    border-right: 11px solid transparent;
    border-top: 14px solid #f5ecd7;
  }
  @media (max-width: 500px) {
    padding: 10px 13px;
    border-radius: 15px;
    font-size: clamp(14px, 4.6vw, 19px);
    line-height: 1.22;
  }
`;
const Menu = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0b171ac9, #0b171ab8);
  padding: 20px;
  color: #eadcc0;
  text-align: center;
  z-index: 3;
  h1 {
    font-family: Georgia, serif;
    font-size: clamp(24px, 4vw, 48px);
    font-weight: normal;
    margin: 0 0 26px;
  }
  button {
    padding: 13px 24px;
    background: #d7bf8b;
    color: #172324;
    border: 1px solid #e3cda0;
    border-radius: 5px;
    font-size: 15px;
  }
  button.secondary {
    background: #20312f;
    color: #c7d9cd;
    border-color: #51675a;
  }
  button:hover {
    filter: brightness(1.13);
  }
  .start {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 26px;
  }
  .hint {
    color: #a8bcb0;
    font-size: 12px;
    margin-top: 15px;
    line-height: 1.6;
  }
  .sound {
    background: transparent;
    border: 0;
    color: #a8bcb0;
    font-size: 12px;
    padding: 8px;
    margin-top: 10px;
  }
  @media (max-height: 420px) {
    padding: 10px;
    .hint .keyboard {
      display: none;
    }
    h1 {
      font-size: 20px;
      margin-bottom: 8px;
    }
    .start {
      margin-top: 10px;
    }
    button {
      font-size: 12px;
      padding: 7px 14px;
    }
    .hint {
      font-size: 10px;
      margin-top: 8px;
    }
    .sound {
      margin-top: 0;
      padding: 4px;
      font-size: 10px;
    }
  }
`;
const Instructions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
  max-width: 800px;
  width: 100%;
  .control {
    padding: 20px 16px;
    border: 1px solid #577160;
    border-radius: 10px;
    background: #142928ce;
  }
  .symbol {
    display: inline-grid;
    place-items: center;
    width: 50px;
    height: 50px;
    border: 2px solid #c1b081;
    border-radius: 50%;
    font-size: 25px;
    font-weight: 600;
    color: #e5d3a7;
    margin-bottom: 12px;
  }
  .joystick {
    font-size: 31px;
    border: 0;
  }
  strong {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: #e3d7b9;
    margin-bottom: 10px;
  }
  p {
    margin: 6px 0;
    font-size: 13px;
    line-height: 1.5;
    color: #c0d0c3;
  }
  kbd {
    font: 12px system-ui;
    color: #f1e6cc;
  }
  @media (max-width: 500px), (max-height: 420px) {
    gap: 8px;
    .control {
      padding: 10px 5px;
    }
    .symbol {
      width: 32px;
      height: 32px;
      font-size: 18px;
      margin-bottom: 5px;
    }
    strong {
      font-size: 11px;
      margin-bottom: 5px;
    }
    p,
    kbd {
      font-size: 10px;
    }
    p {
      margin: 4px 0;
    }
    .keyboard {
      display: none;
    }
  }
  @media (max-height: 420px) {
    .control {
      padding: 7px 4px;
    }
    .symbol {
      width: 24px;
      height: 24px;
      font-size: 16px;
      margin-bottom: 3px;
    }
    strong {
      font-size: 10px;
      margin-bottom: 4px;
    }
    p {
      font-size: 9px;
      line-height: 1.3;
      margin: 3px 0;
    }
  }
`;
interface View {
  phase: Phase;
  hp: number[];
  time: number;
  mode: string;
  winner: string | null;
  line: Line | undefined;
  positions: { x: number; y: number }[];
  width: number;
  height: number;
}
const initial: View = {
  phase: "ready",
  hp: [100, 100],
  time: 90,
  mode: "solo",
  winner: null,
  line: undefined,
  positions: [
    { x: 260, y: 270 },
    { x: 700, y: 270 },
  ],
  width: 960,
  height: 600,
};
export function App() {
  const host = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(initial);
  const [speechSize, setSpeechSize] = useState({ width: 400, height: 120 });
  const [sound, setSound] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const scene = new Arena((m: Match, projection) =>
      setView({
        phase: m.phase,
        hp: m.fighters.map((f) => f.hp),
        time: m.time,
        mode: m.mode,
        winner: m.winner,
        line: m.dialogue.history.at(-1),
        ...projection,
      }),
    );
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: host.current,
      width: host.current.clientWidth,
      height: host.current.clientHeight,
      backgroundColor: "#152932",
      scale: { mode: Phaser.Scale.RESIZE },
      scene: [scene],
      audio: { noAudio: true },
      banner: false,
    });
    return () => game.destroy(true);
  }, []);
  useEffect(() => {
    if (!bubble.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSpeechSize({
        width: entry.target.clientWidth + 4,
        height: entry.target.clientHeight + 4,
      }),
    );
    observer.observe(bubble.current);
    return () => observer.disconnect();
  }, [view.phase, view.line?.fighter]);
  const start = (versus = false) => {
    releaseControls();
    controls.start = versus ? 2 : 1;
  };
  const speakerIndex = view.line?.fighter === "rand" ? 1 : 0;
  const anchor = view.positions[speakerIndex];
  const left = Math.max(
    8,
    Math.min(
      view.width - speechSize.width - 8,
      anchor.x - speechSize.width / 2,
    ),
  );
  const top = Math.max(
    view.height < 420 ? 74 : 110,
    anchor.y - speechSize.height - 25,
  );
  return (
    <Stage aria-label="Fighting arena: Buddha versus Ayn Rand">
      <Canvas ref={host} />
      <Hud>
        {(["buddha", "rand"] as const).map((id, i) => (
          <FighterHud
            key={id}
            style={
              {
                "--fighter-color": ROSTER[id].color,
                textAlign: i ? "right" : "left",
                gridColumn: i ? 3 : 1,
                gridRow: 1,
              } as React.CSSProperties
            }
          >
            <h2>{ROSTER[id].name}</h2>
            <small>
              {i ? (view.mode === "solo" ? "CPU" : "PLAYER 2") : "PLAYER 1"}
            </small>
            <progress
              aria-label={`${ROSTER[id].name} health`}
              max={100}
              value={view.hp[i]}
            />
          </FighterHud>
        ))}
        <Timer style={{ gridColumn: 2, gridRow: 1 }}>
          {Math.ceil(view.time).toString().padStart(2, "0")}
        </Timer>
      </Hud>
      {view.phase === "playing" && view.line && (
        <Speech
          ref={bubble}
          aria-label={`${ROSTER[view.line.fighter].name}: ${MOVES[view.line.move].name}`}
          style={
            {
              left,
              top,
              "--fighter-color": ROSTER[view.line.fighter].color,
              "--tail-x": `${Math.max(18, Math.min(speechSize.width - 18, anchor.x - left))}px`,
            } as React.CSSProperties
          }
        >
          “{view.line.text}”
        </Speech>
      )}
      {view.phase !== "playing" && (
        <Menu>
          <h1>
            {view.phase === "ready"
              ? "Buddha vs. Ayn Rand"
              : view.phase === "paused"
                ? "Paused"
                : view.winner === "draw"
                  ? "Draw"
                  : `${view.winner === "buddha" ? "Buddha" : "Ayn Rand"} wins`}
          </h1>
          <Instructions aria-label="Controls before the fight">
            <div className="control">
              <span className="symbol joystick">✥</span>
              <strong>JOYSTICK</strong>
              <p>← → Move</p>
              <p>↑ Jump · ↓ Crouch</p>
              <p className="keyboard">
                <kbd>WASD / arrow keys</kbd>
              </p>
            </div>
            <div className="control">
              <span className="symbol">A</span>
              <strong>OFFENSE</strong>
              <p>A · Argument</p>
              <p>Toward + A · Special</p>
              <p className="keyboard">
                <kbd>F / Z</kbd>
              </p>
            </div>
            <div className="control">
              <span className="symbol">B</span>
              <strong>DEFENSE</strong>
              <p>B · Timed defense</p>
              <p>Away + B · Escape</p>
              <p>Hold B · Guard</p>
              <p className="keyboard">
                <kbd>G / X</kbd>
              </p>
            </div>
          </Instructions>
          <div className="start">
            {view.phase === "paused" ? (
              <>
                <button
                  onClick={() => {
                    controls.pause = true;
                  }}
                >
                  Resume
                </button>
                <button
                  className="secondary"
                  onClick={() => start(view.mode === "versus")}
                >
                  Restart
                </button>
              </>
            ) : (
              <>
                <button onClick={() => start()}>Fight the computer</button>
                <button className="secondary" onClick={() => start(true)}>
                  Two players
                </button>
              </>
            )}
          </div>
          <div className="hint">
            1 / Enter · solo &nbsp; 2 · two players &nbsp; Esc · pause
            <br />
            <span className="keyboard">
              Player 1: WASD + F / G &nbsp; Player 2: IJKL + ; / '
            </span>
          </div>
          <button
            className="sound"
            aria-pressed={sound}
            onClick={() => {
              controls.sound = !sound;
              setSound(!sound);
            }}
          >
            Sound {sound ? "on" : "off"}
          </button>
        </Menu>
      )}
    </Stage>
  );
}
