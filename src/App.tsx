import { useEffect, useRef, useState } from "react";
import { styled } from "@linaria/react";
import * as Phaser from "phaser";
import { Arena, controls, releaseControls } from "./arena";
import { MOVES, ROSTER } from "./dialogue";
import type { Line } from "./dialogue";
import type { Match, Input, Phase } from "./engine";

const Page = styled.main`
  max-width: 1160px;
  margin: 0 auto;
  padding: 28px 36px 36px;
  @media (max-width: 600px) {
    padding: 14px 12px;
  }
  @media (max-height: 400px) {
    padding: 0;
  }
`;
const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 22px;
  border-bottom: 1px solid #2c393c;
  gap: 12px;
  @media (max-height: 400px) {
    display: none;
  }
`;
const Brand = styled.div`
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #e2d6bb;
  display: flex;
  align-items: center;
  gap: 10px;
  b {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid #a9986b;
    border-radius: 50%;
    font-family: Georgia, serif;
    font-size: 18px;
    font-weight: normal;
    letter-spacing: 0;
  }
  span {
    color: #728984;
  }
`;
const Tag = styled.span`
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #8aa79b;
  display: flex;
  align-items: center;
  gap: 7px;
  &:before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #99d5b8;
  }
  @media (max-width: 500px) {
    display: none;
  }
`;
const Intro = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  padding: 27px 0 22px;
  h1 {
    font-family: Georgia, serif;
    font-weight: normal;
    letter-spacing: -0.04em;
    font-size: 38px;
    margin: 5px 0 8px;
  }
  p {
    color: #8a9e99;
    font-size: 12px;
    margin: 0;
    line-height: 1.5;
  }
  small {
    color: #b5a16f;
    font-size: 10px;
    letter-spacing: 0.2em;
  }
  @media (max-width: 600px) {
    padding: 18px 0;
    h1 {
      font-size: 30px;
    }
  }
  @media (max-height: 400px) {
    display: none;
  }
`;
const Actions = styled.div`
  display: flex;
  gap: 7px;
  button {
    color: #a8b9b1;
    background: #18252a;
    border: 1px solid #34433f;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 11px;
  }
  button:hover {
    color: #f1e4c7;
    border-color: #a38c5b;
  }
  @media (max-width: 650px) {
    flex-wrap: wrap;
    justify-content: end;
  }
`;
const Stage = styled.section`
  position: relative;
  aspect-ratio: 8/5;
  width: 100%;
  overflow: hidden;
  border: 1px solid #47534a;
  border-radius: 8px;
  background: #152932;
  box-shadow: 0 24px 70px #0004;
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  @media (max-height: 400px) {
    height: 100dvh;
    aspect-ratio: auto;
    border: 0;
    border-radius: 0;
  }
`;
const Canvas = styled.div`
  position: absolute;
  inset: 0;
`;
const Hud = styled.div`
  position: absolute;
  left: 3.4%;
  right: 3.4%;
  top: 4%;
  display: grid;
  grid-template-columns: 1fr 62px 1fr;
  gap: 20px;
  pointer-events: none;
  @media (max-width: 500px) {
    gap: 8px;
    grid-template-columns: 1fr 32px 1fr;
  }
`;
const FighterHud = styled.div`
  h2 {
    margin: 0 0 4px;
    font-family: Georgia, serif;
    font-weight: normal;
    font-size: clamp(15px, 2.4vw, 27px);
  }
  small {
    font-size: clamp(7px, 1vw, 9px);
    letter-spacing: 0.16em;
    color: #8b9b93;
  }
  progress {
    appearance: none;
    display: block;
    width: 100%;
    height: 8px;
    border: 1px solid #344842;
    background: #111e23;
    margin: 12px 0 7px;
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
  span {
    font-size: 9px;
    color: #859b91;
    letter-spacing: 0.1em;
  }
  .cooldown {
    display: inline-block;
    width: 42px;
    height: 2px;
    background: var(--fighter-color);
    vertical-align: middle;
    margin-left: 8px;
    transform-origin: left;
  }
  @media (max-width: 500px) {
    progress {
      margin: 6px 0;
      height: 5px;
    }
    span {
      font-size: 7px;
    }
  }
`;
const Timer = styled.div`
  text-align: center;
  color: #e7dab9;
  font-family: Georgia, serif;
  font-size: clamp(20px, 3vw, 36px);
  padding-top: 4px;
  small {
    display: block;
    font-family: system-ui, sans-serif;
    font-size: 8px;
    letter-spacing: 0.12em;
    color: #8b9b93;
    margin-top: 5px;
  }
`;
const DialogueBox = styled.div`
  position: absolute;
  left: 3.4%;
  right: 3.4%;
  bottom: 4%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 26px;
  pointer-events: none;
  .speaker {
    font-size: clamp(7px, 0.95vw, 10px);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .line {
    font-family: Georgia, serif;
    font-size: clamp(11px, 1.7vw, 19px);
    line-height: 1.35;
    color: #ece0c7;
    min-height: 2.6em;
  }
  small {
    display: block;
    font-size: 8px;
    letter-spacing: 0.1em;
    color: #768f85;
    margin-top: 8px;
  }
  @media (max-width: 500px) {
    gap: 14px;
    .speaker {
      margin-bottom: 3px;
      letter-spacing: 0.03em;
    }
    small {
      display: none;
    }
    .line {
      line-height: 1.2;
    }
  }
`;
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0b171a35, #0b171ae8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 18px;
  color: #eadcc0;
  h2 {
    font-family: Georgia, serif;
    font-size: clamp(24px, 4vw, 49px);
    font-weight: normal;
    margin: 10px 0 12px;
    letter-spacing: -0.03em;
  }
  p {
    font-size: clamp(10px, 1.3vw, 13px);
    max-width: 380px;
    line-height: 1.7;
    color: #adbbb0;
    margin: 0 0 22px;
  }
  small {
    font-size: 9px;
    letter-spacing: 0.2em;
    color: #baa575;
  }
  button {
    font-size: 12px;
    padding: 13px 24px;
    background: #d7bf8b;
    color: #172324;
    border: 1px solid #e3cda0;
    border-radius: 3px;
  }
  button.secondary {
    background: #20312f;
    color: #c7d9cd;
    border-color: #51675a;
    margin-left: 10px;
  }
  button:hover {
    filter: brightness(1.13);
  }
  .hint {
    font-size: 10px;
    color: #7f998b;
    margin-top: 18px;
    letter-spacing: 0.06em;
  }
  @media (max-width: 500px) {
    p {
      margin-bottom: 12px;
      max-width: 250px;
    }
    h2 {
      margin: 5px 0;
    }
    button {
      padding: 8px 12px;
      font-size: 10px;
    }
    .hint {
      margin-top: 10px;
      font-size: 8px;
    }
  }
`;
const Below = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 20px;
  gap: 12px;
  font-size: 10px;
  color: #7f968c;
  letter-spacing: 0.05em;
  span {
    color: #b9ab88;
  }
  @media (max-height: 400px) {
    display: none;
  }
`;
const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 14px;
  @media (max-width: 750px) {
    grid-template-columns: 1fr;
  }
  @media (max-height: 400px) {
    display: none;
  }
`;
const Card = styled.div`
  border: 1px solid #30413e;
  background: #142126;
  border-radius: 5px;
  padding: 19px;
  h3 {
    font-size: 10px;
    letter-spacing: 0.16em;
    color: #cabb98;
    font-weight: 500;
    margin: 0 0 16px;
  }
  p {
    font-size: 11px;
    line-height: 1.6;
    color: #8fa69a;
    margin: 10px 0 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 11px;
    color: #bac8bb;
    margin-top: 12px;
  }
  .row small {
    font-size: 9px;
    color: #75958a;
  }
  kbd {
    padding: 3px 6px;
    border: 1px solid #4c5b4e;
    border-radius: 3px;
    background: #1d2d2e;
    color: #e5d9b9;
    font: 10px system-ui;
  }
  .move {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #263834;
    padding: 9px 0;
    gap: 8px;
    font-size: 11px;
    color: #aebeaf;
  }
  .move:last-child {
    border: 0;
  }
  .code {
    font-size: 10px;
    white-space: nowrap;
    color: #d2c298;
  }
`;
const Touch = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 15px 0;
  gap: 20px;
  button {
    touch-action: none;
    user-select: none;
    color: #b8cdbf;
    background: #1b302f;
    border: 1px solid #4b6356;
    border-radius: 7px;
    font-size: 15px;
    padding: 12px 16px;
  }
  button:active {
    background: #456052;
  }
  .pad {
    display: grid;
    grid-template-columns: 40px 40px 40px;
    grid-template-rows: 32px 32px 32px;
    gap: 3px;
    button {
      padding: 0;
    }
  }
  .attack {
    display: flex;
    gap: 10px;
    button {
      min-width: 76px;
      min-height: 65px;
      font-size: 11px;
      line-height: 1.6;
    }
    b {
      display: block;
      font-size: 20px;
      color: #dec799;
    }
  }
  @media (max-height: 400px) {
    display: none;
  }
`;
const Log = styled.details`
  border-top: 1px solid #30413e;
  padding-top: 16px;
  margin-top: 22px;
  font-size: 11px;
  color: #91a69a;
  summary {
    cursor: pointer;
    letter-spacing: 0.05em;
  }
  ol {
    padding-left: 20px;
    line-height: 1.7;
  }
  li {
    padding: 5px 0;
  }
  strong {
    color: #d6c7a4;
    font-weight: 500;
  }
  @media (max-height: 400px) {
    display: none;
  }
`;
interface View {
  phase: Phase;
  hp: number[];
  cooldown: number[];
  time: number;
  mode: string;
  winner: string | null;
  lines: Line[];
}
const initial: View = {
  phase: "ready",
  hp: [100, 100],
  cooldown: [0, 0],
  time: 90,
  mode: "solo",
  winner: null,
  lines: [],
};
export function App() {
  const host = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(initial);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const scene = new Arena((m: Match) =>
      setView({
        phase: m.phase,
        hp: m.fighters.map((f) => f.hp),
        cooldown: m.fighters.map((f) => f.cooldown),
        time: m.time,
        mode: m.mode,
        winner: m.winner,
        lines: [...m.dialogue.history],
      }),
    );
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: host.current,
      width: 960,
      height: 600,
      backgroundColor: "#152932",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [scene],
      audio: { noAudio: true },
      banner: false,
    });
    return () => game.destroy(true);
  }, []);
  const start = (versus = false) => {
    releaseControls();
    controls.start = versus ? 2 : 1;
  };
  const hold = (key: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      controls.p1[key] = true;
      controls.pending1[key] = true;
    },
    onPointerUp: () => {
      controls.p1[key] = false;
    },
    onPointerCancel: () => {
      controls.p1[key] = false;
    },
    onLostPointerCapture: () => {
      controls.p1[key] = false;
    },
  });
  const latest = (id: "buddha" | "rand") =>
    [...view.lines].reverse().find((line) => line.fighter === id);
  return (
    <Page>
      <Header>
        <Brand>
          <b>Φ</b> STREET PHILOSOPHY FIGHTER <span>/ 001</span>
        </Brand>
        <Tag>TWO-FIGHTER PROTOTYPE</Tag>
      </Header>
      <Intro>
        <div>
          <small>THE ULTIMATE BATTLE OF IDEAS</small>
          <h1>Make your argument.</h1>
          <p>Two philosophies. Four moves. Every blow has a point.</p>
        </div>
        <Actions>
          <button
            onClick={() => {
              controls.pause = true;
            }}
            disabled={view.phase === "ready" || view.phase === "finished"}
          >
            {view.phase === "paused" ? "Resume" : "Pause"}
          </button>
          <button onClick={() => start(view.mode === "versus")}>Restart</button>
          <button
            aria-pressed={sound}
            onClick={() => {
              controls.sound = !sound;
              setSound(!sound);
            }}
          >
            Sound {sound ? "on" : "off"}
          </button>
        </Actions>
      </Intro>
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
              <h2 style={{ color: ROSTER[id].color }}>{ROSTER[id].name}</h2>
              <small>
                {ROSTER[id].school} ·{" "}
                {i ? (view.mode === "solo" ? "CPU" : "PLAYER 2") : "PLAYER 1"}
              </small>
              <progress
                aria-label={`${ROSTER[id].name} health`}
                max={100}
                value={view.hp[i]}
              />
              <span>
                {Math.ceil(view.hp[i])} / 100{" "}
                <span
                  className="cooldown"
                  style={{
                    transform: `scaleX(${Math.max(0, 1 - view.cooldown[i] / 1.15)})`,
                  }}
                />
              </span>
            </FighterHud>
          ))}
          <Timer style={{ gridColumn: 2, gridRow: 1 }}>
            {Math.ceil(view.time).toString().padStart(2, "0")}
            <small>ROUND 01</small>
          </Timer>
        </Hud>
        {view.phase === "playing" && (
          <DialogueBox>
            {(["buddha", "rand"] as const).map((id) => {
              const line = latest(id);
              return (
                <div key={id}>
                  <div className="speaker" style={{ color: ROSTER[id].color }}>
                    {line ? MOVES[line.move].name : ROSTER[id].school}
                  </div>
                  <div className="line">
                    {line
                      ? `“${line.text}”`
                      : id === "buddha"
                        ? "What are you holding on to?"
                        : "What will you choose to create?"}
                  </div>
                  <small>
                    {ROSTER[id].name} ·{" "}
                    {line
                      ? `ARGUMENT ${line.serial.toString().padStart(2, "0")}`
                      : "AWAITING YOUR FIRST MOVE"}
                  </small>
                </div>
              );
            })}
          </DialogueBox>
        )}
        {view.phase !== "playing" && (
          <Overlay>
            <small>
              {view.phase === "ready"
                ? "DESIRE / PURPOSE"
                : view.phase === "paused"
                  ? "TAKE A BREATH"
                  : "THE ARGUMENT RESTS"}
            </small>
            <h2>
              {view.phase === "ready"
                ? "Buddha vs. Ayn Rand"
                : view.phase === "paused"
                  ? "A moment of reflection."
                  : view.winner === "draw"
                    ? "An unresolved dispute."
                    : `${view.winner === "buddha" ? "Buddha" : "Ayn Rand"} prevails.`}
            </h2>
            <p>
              {view.phase === "ready"
                ? "Enter the court of contradictions. Move, strike, and answer your opponent with ideas as well as force."
                : view.phase === "paused"
                  ? "The conversation will continue when you are ready."
                  : "Different moves. Different replies. Take another position."}
            </p>
            <div>
              {view.phase === "paused" ? (
                <button
                  onClick={() => {
                    controls.pause = true;
                  }}
                >
                  Continue · Esc
                </button>
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
              {view.phase === "paused"
                ? ""
                : "1 / Enter · solo     2 · two players"}
            </div>
          </Overlay>
        )}
      </Stage>
      <Below>
        <div>
          <span>01</span> / THE COURT OF CONTRADICTIONS
        </div>
        <div>Authored, contextual dialogue · joystick + two buttons</div>
      </Below>
      <Touch aria-label="On-screen player one controls">
        <div className="pad">
          <button
            style={{ gridColumn: 2, gridRow: 1 }}
            aria-label="Jump"
            {...hold("up")}
          >
            ↑
          </button>
          <button
            style={{ gridColumn: 1, gridRow: 2 }}
            aria-label="Move left"
            {...hold("left")}
          >
            ←
          </button>
          <button
            style={{ gridColumn: 3, gridRow: 2 }}
            aria-label="Move right"
            {...hold("right")}
          >
            →
          </button>
          <button
            style={{ gridColumn: 2, gridRow: 3 }}
            aria-label="Crouch"
            {...hold("down")}
          >
            ↓
          </button>
        </div>
        <div className="attack">
          <button {...hold("a")} aria-label="Offense">
            <b>A</b>OFFENSE
          </button>
          <button {...hold("b")} aria-label="Defense">
            <b>B</b>DEFENSE
          </button>
        </div>
      </Touch>
      <ControlsGrid>
        <Card>
          <h3>YOUR CONTROLS</h3>
          <div className="row">
            <span>Move / jump / crouch</span>
            <span>
              <kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd>
            </span>
          </div>
          <div className="row">
            <span>Offense · button A</span>
            <kbd>F / Z</kbd>
          </div>
          <div className="row">
            <span>Defense · button B</span>
            <kbd>G / X</kbd>
          </div>
          <p>
            Hold B to guard. Toward + A selects offense 2; away + B selects
            defense 2. Directions follow your opponent.
          </p>
          <p>
            Player 2: I J K L · ; / ' · Gamepads: left stick + first two face
            buttons. Esc pauses.
          </p>
        </Card>
        {(["buddha", "rand"] as const).map((id) => (
          <Card key={id}>
            <h3 style={{ color: ROSTER[id].color }}>
              {ROSTER[id].name.toUpperCase()} / MOVE LIST
            </h3>
            {ROSTER[id].moves.map((move, i) => (
              <div className="move" key={move}>
                <span>{MOVES[move].name}</span>
                <span className="code">
                  {["A", "TOWARD + A", "B", "AWAY + B"][i]}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </ControlsGrid>
      <Log>
        <summary>The argument so far · {view.lines.length} exchanges</summary>
        {view.lines.length ? (
          <ol>
            {view.lines.map((line) => (
              <li key={line.serial}>
                <strong>
                  {ROSTER[line.fighter].name} / {MOVES[line.move].name}:
                </strong>{" "}
                {line.text}
              </li>
            ))}
          </ol>
        ) : (
          <p>
            Make a move to begin the conversation. Dialogue is original writing
            inspired by each philosophy.
          </p>
        )}
      </Log>
    </Page>
  );
}
