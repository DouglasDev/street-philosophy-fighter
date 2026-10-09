import { useEffect, useRef, useState } from "react";
import { styled } from "@linaria/react";
import * as Phaser from "phaser";
import { Arena, controls, releaseControls } from "./arena";
import { ROSTER } from "./dialogue";
import type { Line } from "./dialogue";
import { DEBATE, TOPIC, ZONES, MAX_EXCHANGES } from "./debate";
import type { Rebuttal, Answer, Zone } from "./debate";
import { Match, WINDUP, PARRY_WINDOW } from "./engine";
import type { DebateStage, Phase } from "./engine";
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
  top: 8%;
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
const Speech = styled.div`
  position: absolute;
  width: min(530px, 70vw);
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
  font-size: clamp(17px, 2.2vw, 28px);
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
  .part {
    font: 10px system-ui;
    letter-spacing: 0.1em;
    color: #496555;
    margin-bottom: 7px;
    display: block;
  }
  @media (max-width: 500px) {
    padding: 8px 11px;
    border-radius: 15px;
    font-size: 13px;
    width: min(530px, 90vw);
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

const PrototypeLabel = styled.div`
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  color: #ff4545;
  font: 900 clamp(12px, 1.3vw, 18px) system-ui;
  letter-spacing: 0.12em;
  text-align: center;
  z-index: 4;
  pointer-events: none;
  @media (max-height: 420px) {
    top: 2px;
    font-size: 10px;
  }
`;
const Topic = styled.div`
  position: absolute;
  top: 28px;
  left: 4%;
  right: 4%;
  text-align: center;
  color: #f1e7cd;
  font-family: Georgia, serif;
  font-size: clamp(13px, 2vw, 24px);
  line-height: 1.25;
  @media (max-height: 420px) {
    top: 16px;
    font-size: 12px;
  }
`;
const Choices = styled.section`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 2%;
  width: min(980px, 94%);
  z-index: 2;
  padding: 12px 16px;
  border: 1px solid #536957;
  background: #102322f2;
  border-radius: 12px;
  h3 {
    font-size: 12px;
    color: #d2c394;
    letter-spacing: 0.06em;
    margin: 0 0 8px;
    font-weight: 500;
  }
  button.option {
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
    width: 100%;
    padding: 9px 13px;
    margin: 5px 0;
    border: 1px solid #365246;
    border-radius: 6px;
    background: #1b312d;
    color: #eee3c9;
  }
  button.option[aria-pressed="true"] {
    background: #314b3c;
    border-color: #e0c78e;
    box-shadow: inset 3px 0 #e0c78e;
  }
  button.option:disabled {
    opacity: 0.65;
    cursor: default;
  }
  .number {
    font-size: 15px;
    color: #ccb985;
  }
  .text {
    font-family: Georgia, serif;
    font-size: clamp(14px, 1.5vw, 20px);
    line-height: 1.25;
  }
  .technique {
    font: 10px system-ui;
    color: #97b9a6;
    margin-top: 3px;
    display: block;
  }
  .keys {
    color: #9ab6a5;
    font-size: 10px;
    text-align: right;
    margin-top: 7px;
  }
  @media (max-height: 420px) {
    bottom: 3px;
    padding: 5px 7px;
    border-radius: 6px;
    width: 97%;
    h3 {
      font-size: 9px;
      margin-bottom: 4px;
    }
    button.option {
      gap: 6px;
      padding: 4px 6px;
      margin: 3px 0;
    }
    .number {
      font-size: 10px;
    }
    .text {
      font-size: 11px;
    }
    .technique {
      font-size: 8px;
      margin-top: 2px;
    }
    .keys {
      font-size: 8px;
      margin-top: 3px;
    }
  }
`;
const Exchange = styled.div`
  text-align: center;
  font-size: clamp(11px, 1.4vw, 17px);
  color: #d8c694;
  span {
    display: block;
    font-size: 9px;
    color: #8dad98;
    margin-top: 4px;
  }
  @media (max-height: 420px) {
    font-size: 11px;
    span {
      font-size: 7px;
      margin-top: 2px;
    }
  }
`;
const Attack = styled.section`
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: min(650px, 92%);
  text-align: center;
  color: #eadfc4;
  background: #112724e8;
  border: 1px solid #627860;
  border-radius: 10px;
  padding: 20px;
  h3 {
    font:
      clamp(19px, 2.6vw, 30px) Georgia,
      serif;
    margin: 0 0 12px;
  }
  p {
    font-size: 13px;
    color: #b9cbbb;
    line-height: 1.5;
    margin: 8px 0;
  }
  .track {
    height: 12px;
    background: #263e32;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    margin: 15px 0;
  }
  .window {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 22%;
    background: #c2b57066;
  }
  .fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: #91e0c6;
  }
  .zones {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  button {
    background: #263e32;
    border: 1px solid #68826a;
    border-radius: 5px;
    color: #dcd3b9;
    padding: 10px;
  }
  button[aria-pressed="true"] {
    border-color: #e5c784;
    background: #45533c;
  }
  @media (max-height: 420px) {
    bottom: 7px;
    padding: 9px;
    h3 {
      font-size: 16px;
      margin-bottom: 6px;
    }
    p {
      font-size: 10px;
      margin: 5px 0;
    }
    .track {
      margin: 8px 0;
      height: 8px;
    }
    button {
      font-size: 10px;
      padding: 6px;
    }
  }
`;
const Verdict = styled.section`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 4%;
  width: min(760px, 94%);
  background: #112724f2;
  border: 1px solid #627860;
  padding: 18px;
  border-radius: 10px;
  color: #eaddc0;
  text-align: center;
  h3 {
    font:
      clamp(16px, 2vw, 25px) Georgia,
      serif;
    margin: 0 0 9px;
  }
  p {
    font-size: 13px;
    line-height: 1.5;
    color: #abc5b3;
    margin: 0 0 12px;
  }
  button {
    background: #d7bf8b;
    color: #172324;
    padding: 10px 22px;
    border: 0;
    border-radius: 4px;
  }
  @media (max-height: 420px) {
    bottom: 4px;
    padding: 7px;
    h3 {
      font-size: 12px;
      margin: 0 0 4px;
    }
    p {
      font-size: 10px;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    button {
      font-size: 10px;
      padding: 6px 12px;
    }
  }
`;
interface View {
  phase: Phase;
  stage: DebateStage;
  hp: number[];
  pressure: number[];
  mode: string;
  winner: string | null;
  line: Line | undefined;
  positions: { x: number; y: number }[];
  width: number;
  height: number;
  nodeId: string;
  selection: number;
  reviewZone: Zone;
  reviewing: boolean;
  options: Rebuttal[];
  answers: Answer[];
  selected: Rebuttal | null;
  result: string;
  explanation: string;
  remaining: number;
  exchange: number;
  actor: number;
  attacker: number;
  defender: number;
  humanTurn: boolean;
  guardZone: Zone;
}
function snapshot(m: Match): Omit<View, "positions" | "width" | "height"> {
  return {
    phase: m.phase,
    stage: m.stage,
    hp: m.fighters.map((f) => f.hp),
    pressure: m.fighters.map((f) => f.pressure),
    mode: m.mode,
    winner: m.winner,
    line: m.dialogue.history.at(-1),
    nodeId: m.nodeId,
    selection: m.selection,
    reviewZone: m.reviewZone,
    reviewing: m.reviewing,
    options: [...m.options],
    answers: [...m.answers],
    selected: m.selected,
    result: m.result,
    explanation: m.explanation,
    remaining: m.remaining,
    exchange: m.exchange,
    actor: m.actor,
    attacker: m.attacker,
    defender: m.defender,
    humanTurn: m.humanTurn,
    guardZone: m.fighters[m.defender].guardZone,
  };
}
const initial: View = {
  ...snapshot(new Match()),
  positions: [
    { x: 300, y: 270 },
    { x: 660, y: 270 },
  ],
  width: 960,
  height: 600,
};
export function App() {
  const host = useRef<HTMLDivElement>(null),
    bubble = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(initial),
    [speechSize, setSpeechSize] = useState({ width: 400, height: 120 }),
    [sound, setSound] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const scene = new Arena((m, projection) =>
      setView({ ...snapshot(m), ...projection }),
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
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      banner: false,
    });
    return () => game.destroy(true);
  }, []);
  const reading = view.stage === "select";
  const inspecting = reading || (view.stage === "answer" && view.reviewing);
  const speakerIndex = inspecting
    ? view.defender
    : view.line?.fighter === "rand"
      ? 1
      : 0;
  const node = DEBATE[view.nodeId];
  const speech = inspecting ? node.claim[view.reviewZone] : view.line?.text;
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
  }, [view.phase, speakerIndex, speech]);
  const start = (versus = false) => {
    releaseControls();
    controls.start = versus ? 2 : 1;
  };
  const anchor = view.positions[speakerIndex],
    left = Math.max(
      8,
      Math.min(
        view.width - speechSize.width - 8,
        anchor.x - speechSize.width / 2,
      ),
    );
  const top = Math.max(
    view.height < 420 ? 69 : 120,
    anchor.y - speechSize.height - 25,
  );
  const ids = ["buddha", "rand"] as const;
  const chooser = ROSTER[ids[view.actor]].name,
    defender = ROSTER[ids[view.defender]].name;
  return (
    <Stage aria-label="Offline debate fighting arena">
      <Canvas ref={host} />
      <PrototypeLabel>PROTOTYPE</PrototypeLabel>
      <Topic>{TOPIC}</Topic>
      <Hud>
        {ids.map((id, i) => (
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
              {i ? (view.mode === "solo" ? "CPU" : "PLAYER 2") : "PLAYER 1"} ·
              PRESSURE {view.pressure[i]}/3
            </small>
            <progress
              aria-label={`${ROSTER[id].name} health`}
              max={100}
              value={view.hp[i]}
            />
          </FighterHud>
        ))}
        <Exchange style={{ gridColumn: 2, gridRow: 1 }}>
          {view.exchange}/{MAX_EXCHANGES}
          <span>EXCHANGE</span>
        </Exchange>
      </Hud>
      {view.phase === "playing" && (
        <>
          {speech && (
            <Speech
              ref={bubble}
              aria-label={`${ROSTER[ids[speakerIndex]].name} statement`}
              style={
                {
                  left,
                  top,
                  "--fighter-color": ROSTER[ids[speakerIndex]].color,
                  "--tail-x": `${Math.max(18, Math.min(speechSize.width - 18, anchor.x - left))}px`,
                } as React.CSSProperties
              }
            >
              {inspecting && (
                <span className="part">
                  {ZONES[view.reviewZone].label} ·{" "}
                  {ZONES[view.reviewZone].part.toUpperCase()}
                </span>
              )}
              “{speech}”
            </Speech>
          )}
          {(view.stage === "select" || view.stage === "answer") && (
            <Choices
              aria-label={reading ? "Choose a rebuttal" : "Choose an answer"}
            >
              <h3>
                {chooser} ·{" "}
                {view.humanTurn
                  ? reading
                    ? "Choose your challenge"
                    : "Answer the challenge"
                  : "Considering a response…"}
              </h3>
              {(reading ? view.options : view.answers).map((option, i) => (
                <button
                  className="option"
                  key={option.text}
                  disabled={!view.humanTurn}
                  aria-pressed={view.selection === i}
                  onClick={() => {
                    controls.choice = i;
                  }}
                >
                  <span className="number">{i + 1}</span>
                  <span className="text">
                    {option.text}
                    {"target" in option && (
                      <span className="technique">
                        {ZONES[option.target].label} · {option.technique} ·{" "}
                        {ZONES[option.target].attack}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              <div className="keys">
                ↑ ↓ select · A commit ·{" "}
                <button
                  onClick={() => {
                    controls.review = true;
                  }}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "inherit",
                    font: "inherit",
                    padding: 0,
                  }}
                >
                  B inspect {ZONES[view.reviewZone].part.toLowerCase()}
                </button>
              </div>
            </Choices>
          )}
          {view.stage === "windup" && (
            <Attack aria-label="Timed defense">
              <h3>
                {ZONES[view.selected!.target].label} ·{" "}
                {ZONES[view.selected!.target].attack}
              </h3>
              <p>
                {view.selected!.technique} · {defender}, defend your{" "}
                {ZONES[view.selected!.target].part.toLowerCase()}.
              </p>
              <div className="track">
                <div className="window" />
                <div
                  className="fill"
                  style={{ width: `${(1 - view.remaining / WINDUP) * 100}%` }}
                />
              </div>
              <p>
                {view.remaining <= PARRY_WINDOW
                  ? "PARRY NOW · press B"
                  : "Change stance, then press B as the bar reaches the gold zone"}
              </p>
              <div className="zones">
                {(["high", "middle", "low"] as Zone[]).map((zone) => (
                  <button
                    key={zone}
                    aria-pressed={view.guardZone === zone}
                    disabled={view.mode === "solo" && view.defender === 1}
                    onClick={() => {
                      controls.defense = zone;
                    }}
                  >
                    {zone === "high"
                      ? "↑ + B"
                      : zone === "middle"
                        ? "Neutral + B"
                        : "↓ + B"}{" "}
                    · {ZONES[zone].label}
                  </button>
                ))}
              </div>
            </Attack>
          )}
          {view.stage === "impact" && (
            <Verdict>
              <h3>{view.result}</h3>
              <p>A physical defense does not settle the argument.</p>
            </Verdict>
          )}
          {view.stage === "continue" && (
            <Verdict aria-label="Debate outcome">
              <h3>{view.result}</h3>
              <p>{view.explanation}</p>
              <button
                onClick={() => {
                  controls.advance = true;
                }}
              >
                Continue · A
              </button>
            </Verdict>
          )}
        </>
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
          <Instructions aria-label="Debate controls before the fight">
            <div className="control">
              <span className="symbol joystick">✥</span>
              <strong>READ & CHOOSE</strong>
              <p>↑ ↓ Select a response</p>
              <p>A · Commit the argument</p>
              <p>B · Inspect the claim</p>
            </div>
            <div className="control">
              <span className="symbol">A</span>
              <strong>ATTACK THE CLAIM</strong>
              <p>High · Conclusion</p>
              <p>Middle · Inference</p>
              <p>Low · Premise</p>
            </div>
            <div className="control">
              <span className="symbol">B</span>
              <strong>PARRY & ANSWER</strong>
              <p>↑ High · ↓ Low</p>
              <p>Neutral · Middle</p>
              <p>B · Parry on impact</p>
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
                <button onClick={() => start()}>Debate the computer</button>
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
