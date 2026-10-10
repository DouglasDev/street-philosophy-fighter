import { styled } from "@linaria/react";
import { controls, releaseControls } from "./arena";
import { DEBATE, TOPIC, ZONES, MAX_EXCHANGES } from "./debate";
import { ROSTER } from "./dialogue";
import { WINDUP, PARRY_WINDOW } from "./engine";
import type { View } from "./view";

const Label = styled.div`
  position: absolute; top: 2px; left: 0; right: 0;
  text-align: center; color: #ff4545;
  font: 900 9px/12px system-ui; letter-spacing: 0.12em;
`;
const Reading = styled.section`
  position: absolute; left: 88px; right: 5px; top: 19px; bottom: 5px;
  display: grid; grid-template-rows: auto minmax(0, 1fr) 13px; gap: 5px;
`;
const Statement = styled.div`
  padding: 6px 8px; border: 1px solid var(--fighter-color);
  border-radius: 9px; background: #f5ecd7; color: #19282b;
  font: 12px/1.2 Georgia, serif;
  .caption { display: block; font: 8px/10px system-ui; margin-bottom: 3px; color: #486352; }
`;
const Choices = styled.div`
  display: grid; grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 4px;
  button {
    min-height: 0; display: grid; grid-template-columns: 19px 1fr;
    align-items: center; gap: 4px; text-align: left;
    padding: 3px 5px; border: 1px solid #476657; border-radius: 5px;
    background: #1b312d; color: #eee3c9;
    font: 11px/1.2 Georgia, serif;
  }
  button[aria-pressed="true"] { background: #314b3c; border-color: #e0c78e; box-shadow: inset 2px 0 #e0c78e; }
  button:disabled { opacity: 0.65; }
  .number { text-align: center; font: 11px/13px system-ui; color: #d9c28d; }
  .target { display: block; font: 7px/10px system-ui; color: #abd3b8; }
`;
const Keys = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  color: #b3cdbb; font: 8px/12px system-ui;
  button { background: none; padding: 0; color: inherit; border: 0; font: inherit; }
`;
const PortraitName = styled.div`
  position: absolute; left: 4px; width: 78px; top: 214px;
  text-align: center; color: var(--fighter-color); font: 11px/14px Georgia, serif;
`;
const Health = styled.div`
  position: absolute; left: 8px; right: 8px; top: 19px;
  display: grid; grid-template-columns: 1fr 28px 1fr; gap: 8px;
  .fighter { font: 10px/12px Georgia, serif; color: var(--fighter-color); }
  .round { text-align: center; font: 9px/12px system-ui; color: #d9c28d; }
  progress { appearance: none; display: block; width: 100%; height: 4px; margin-top: 3px; border: 0; background: #263b37; }
  progress::-webkit-progress-bar { background: #263b37; }
  progress::-webkit-progress-value { background: var(--fighter-color); }
`;
const Attack = styled.section`
  position: absolute; left: 8px; right: 8px; bottom: 5px;
  display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center;
  padding: 5px 7px; border: 1px solid #789276; border-radius: 5px;
  background: #102322f2; color: #f1e6c9; font: bold 12px/15px system-ui;
  .track { height: 5px; position: relative; background: #314d40; overflow: hidden; }
  .window { position: absolute; right: 0; top: 0; bottom: 0; width: 22%; background: #dcc36d; }
  .fill { position: absolute; left: 0; top: 0; bottom: 0; background: #91e0c6; }
  button { background: none; border: 0; padding: 0; color: #f1e6c9; font: bold 11px/15px system-ui; }
`;
const Outcome = styled.div`
  display: flex; flex-direction: column; justify-content: center; gap: 9px;
  color: #eaddc0;
  h2 { margin: 0; font: 14px/17px Georgia, serif; color: #e4c98d; }
  p { margin: 0; font: 11px/14px system-ui; }
  button { align-self: flex-start; padding: 6px 12px; border: 0; border-radius: 4px; background: #d7bf8b; color: #172324; font: 11px/13px system-ui; }
`;
const Impact = styled.div`
  position: absolute; left: 8px; right: 8px; bottom: 6px;
  text-align: center; color: #f1e6c9; font: bold 13px/18px system-ui;
`;
const Menu = styled.section`
  position: absolute; inset: 18px 8px 7px;
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px; border-radius: 8px; background: #102322f5;
  color: #eadfc4; text-align: center;
  h1 { margin: 0; font: 20px/24px Georgia, serif; }
  .topic { font: 12px/15px Georgia, serif; margin: 0; }
  .instructions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .instructions div { border: 1px solid #526e59; padding: 6px; border-radius: 5px; font: 10px/15px system-ui; }
  strong { display: block; color: #e4c98d; font: bold 11px/15px system-ui; }
  .start { display: flex; gap: 6px; justify-content: center; }
  button { padding: 7px 9px; border: 1px solid #e3cda0; border-radius: 4px; background: #d7bf8b; color: #172324; font: 11px/13px system-ui; }
  .secondary { background: #263e32; color: #eaddc0; border-color: #68826a; }
  .hint { color: #adc7b5; font: 9px/12px system-ui; }
  .sound { padding: 0; border: 0; background: none; color: #adc7b5; font: 9px/12px system-ui; }
`;
const ids = ["buddha", "rand"] as const;
const color = (index: number) => ({ "--fighter-color": ROSTER[ids[index]].color }) as React.CSSProperties;

export function GameScreen({ view, sound, setSound }: { view: View; sound: boolean; setSound: (value: boolean) => void }) {
  const node = DEBATE[view.nodeId];
  const selecting = view.stage === "select";
  const reviewing = (selecting || view.stage === "answer") && view.reviewing;
  const reading = view.phase === "playing" && ["select", "answer", "continue"].includes(view.stage);
  const speaker = selecting || reviewing || view.stage === "continue" ? view.defender : view.attacker;
  const portrait = view.stage === "continue" ? speaker : view.actor;
  const statement = reviewing ? node.claim[view.reviewZone]
    : selecting ? node.argument
    : view.stage === "continue" ? view.answered?.text : view.selected?.text;
  const heading = view.answered?.kind === "concede" ? "Claim revised"
    : view.answered?.kind === "evade" ? "Guard weakened" : "Objection answered";
  const start = (versus = false) => { releaseControls(); controls.start = versus ? 2 : 1; };
  const target = view.selected?.target ?? "middle";
  const direction = target === "high" ? "↑" : target === "low" ? "↓" : "•";
  return <>
    <Label data-layout="prototype">PROTOTYPE</Label>
    {reading && <>
      <PortraitName style={color(portrait)} data-layout="portrait-name">{ROSTER[ids[portrait]].name}</PortraitName>
      <Reading aria-label={view.stage === "continue" ? "Debate outcome" : selecting ? "Choose a rebuttal" : "Choose an answer"}>
        <Statement style={{ ...color(speaker), ...(selecting && !reviewing ? { fontSize: 11, padding: "4px 8px" } : {}) }} data-layout="statement" aria-label={`${ROSTER[ids[speaker]].name} statement`}>
          <span className="caption">{ROSTER[ids[speaker]].name} · {reviewing ? ZONES[view.reviewZone].part : selecting ? "Argument" : view.stage === "continue" ? "Reply" : "Objection"}</span>
          “{statement}”
        </Statement>
        {view.stage === "continue" ? <Outcome data-layout="outcome">
          <h2>{heading}</h2><p>{view.explanation}</p>
          <button onClick={() => { controls.advance = true; }}>A · Continue</button>
        </Outcome> : <Choices data-layout="choices">
          {(selecting ? view.options : view.answers).map((option, index) =>
            <button key={option.text} disabled={!view.humanTurn} aria-pressed={view.selection === index}
              onClick={() => { controls.choice = index; }}>
              <span className="number">{index + 1}{"target" in option && <span className="target">{ZONES[option.target].label === "MIDDLE" ? "MID" : ZONES[option.target].label}</span>}</span>
              <span data-copy>{option.text}</span>
            </button>)}
        </Choices>}
        <Keys data-layout="keys">
          <span>{view.stage === "continue" ? `Exchange ${view.exchange}/${MAX_EXCHANGES}` : view.humanTurn ? `${ROSTER[ids[view.actor]].name} · ↑↓ · A Confirm` : `${ROSTER[ids[view.actor]].name} choosing…`}</span>
          {view.stage !== "continue" && <button onClick={() => { controls.review = true; }}>B · Inspect</button>}
        </Keys>
      </Reading>
    </>}
    {view.phase === "playing" && !reading && <>
      <Health data-layout="health">
        {ids.map((id, i) => <div key={id} className="fighter" style={{ ...color(i), gridColumn: i ? 3 : 1, gridRow: 1, textAlign: i ? "right" : "left" }}>
          {ROSTER[id].name}<progress aria-label={`${ROSTER[id].name} health`} max={100} value={view.hp[i]} />
        </div>)}
        <div className="round" style={{ gridColumn: 2, gridRow: 1 }}>{view.exchange}/{MAX_EXCHANGES}</div>
      </Health>
      {view.stage === "windup" && <Attack aria-label="Timed defense" data-layout="attack">
        <span>{ZONES[target].label === "MIDDLE" ? "MID" : ZONES[target].label}</span>
        <div className="track"><div className="window" /><div className="fill" style={{ width: `${(1 - view.remaining / WINDUP) * 100}%` }} /></div>
        <button disabled={view.mode === "solo" && view.defender === 1} aria-label={`Parry ${target}`}
          onClick={() => { controls.defense = target; }}>{view.remaining <= PARRY_WINDOW ? "NOW" : direction} + B</button>
      </Attack>}
      {view.stage === "impact" && <Impact data-layout="impact">{view.lastDefense === "parry" ? "PARRIED" : view.lastDefense === "block" ? `BLOCK · −${view.lastDamage}` : `HIT · −${view.lastDamage}`}</Impact>}
    </>}
    {view.phase !== "playing" && <Menu aria-label="Game menu" data-layout="menu">
      <h1>{view.phase === "ready" ? "Buddha vs. Ayn Rand" : view.phase === "paused" ? "Paused" : view.winner === "draw" ? "Draw" : `${view.winner === "buddha" ? "Buddha" : "Ayn Rand"} wins`}</h1>
      <p className="topic">{TOPIC}</p>
      <div className="instructions">
        <div><strong>CHOOSE</strong>↑ ↓ Select<br />A · Confirm<br />B · Inspect</div>
        <div><strong>PARRY</strong>↑ High · ↓ Low<br />Neutral · Middle<br />B · On impact</div>
      </div>
      <div className="start">
        {view.phase === "paused" ? <><button onClick={() => { controls.pause = true; }}>Resume</button><button className="secondary" onClick={() => start(view.mode === "versus")}>Restart</button></>
          : <><button onClick={() => start()}>1 · Solo</button><button className="secondary" onClick={() => start(true)}>2 · Two players</button></>}
      </div>
      <div className="hint">{view.phase === "finished" ? "Play again · 1 or 2" : "1 / 2 Start · Esc Pause"}</div>
      <button className="sound" aria-pressed={sound} onClick={() => { controls.sound = !sound; setSound(!sound); }}>Sound {sound ? "on" : "off"}</button>
    </Menu>}
  </>;
}
