import type { Line } from "./dialogue";
import type { Rebuttal, Answer, Zone } from "./debate";
import type { Match, DebateStage, Phase } from "./engine";
export interface View {
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
  answered: Answer | null;
  lastDamage: number;
  lastDefense: string | null;
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
export function snapshot(m: Match): Omit<View, "positions" | "width" | "height"> {
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
    answered: m.answered,
    lastDamage: m.lastDamage,
    lastDefense: m.lastDefense,
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
