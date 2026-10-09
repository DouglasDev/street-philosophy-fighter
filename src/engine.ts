import { Dialogue, ROSTER } from "./dialogue.ts";
import type { FighterId, MoveId, Line } from "./dialogue.ts";
import { DEBATE, ENTRY, MAX_EXCHANGES } from "./debate.ts";
import type { Rebuttal, Answer, Zone } from "./debate.ts";
export type Phase = "ready" | "playing" | "paused" | "finished";
export type DebateStage =
  | "select"
  | "windup"
  | "impact"
  | "answer"
  | "continue";
export interface Input {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  a: boolean;
  b: boolean;
}
export const emptyInput = (): Input => ({
  left: false,
  right: false,
  up: false,
  down: false,
  a: false,
  b: false,
});
export interface Fighter {
  id: FighterId;
  x: number;
  y: number;
  vy: number;
  hp: number;
  facing: number;
  cooldown: number;
  active: number;
  immune: number;
  guard: boolean;
  crouch: boolean;
  stun: number;
  move: MoveId | null;
  hit: number;
  previous: Input;
  pressure: number;
  guardZone: Zone;
  stance: boolean;
}
export interface Projectile {
  owner: number;
  x: number;
  y: number;
  direction: number;
  life: number;
}
export interface Effect {
  id: number;
  kind: "hit" | "block" | "cast" | "dodge";
  x: number;
  y: number;
  color: string;
  life: number;
}
export const WINDUP = 1.6;
export const PARRY_WINDOW = 0.35;
export class Match {
  phase: Phase = "ready";
  mode: "solo" | "versus" = "solo";
  winner: FighterId | "draw" | null = null;
  fighters: Fighter[] = [];
  projectiles: Projectile[] = [];
  effects: Effect[] = [];
  dialogue = new Dialogue();
  stage: DebateStage = "select";
  nodeId = ENTRY;
  options: Rebuttal[] = [];
  answers: Answer[] = [];
  selection = 0;
  reviewZone: Zone = "high";
  reviewing = false;
  private reviewSteps = 0;
  exchange = 1;
  remaining = 0;
  selected: Rebuttal | null = null;
  answered: Answer | null = null;
  result = "";
  explanation = "";
  lastDamage = 0;
  lastDefense: "parry" | "block" | "hit" | null = null;
  private serial = 0;
  private aiElapsed = 0;
  private defenseAt = Infinity;
  private defenseZone: Zone = "high";
  private guardLinger = 0;
  private aiDefense: "parry" | "block" | "hit" = "hit";
  private aiHasDefended = false;
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
    this.reset();
  }
  get node() {
    return DEBATE[this.nodeId];
  }
  get defender() {
    return this.node.claimant === "buddha" ? 0 : 1;
  }
  get attacker() {
    return 1 - this.defender;
  }
  get actor() {
    return this.stage === "answer" ? this.defender : this.attacker;
  }
  get humanTurn() {
    return this.mode === "versus" || this.actor === 0;
  }
  private shuffled<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  reset(mode: "solo" | "versus" = this.mode) {
    this.mode = mode;
    this.phase = "ready";
    this.winner = null;
    this.exchange = 1;
    this.effects = [];
    this.projectiles = [];
    this.dialogue = new Dialogue();
    this.serial = 0;
    this.fighters = (["buddha", "rand"] as FighterId[]).map((id, i) => ({
      id,
      x: i ? 660 : 300,
      y: 425,
      vy: 0,
      hp: 100,
      facing: i ? -1 : 1,
      cooldown: 0,
      active: 0,
      immune: 0,
      guard: false,
      crouch: false,
      stun: 0,
      move: null,
      hit: 0,
      previous: emptyInput(),
      pressure: 0,
      guardZone: "high",
      stance: false,
    }));
    this.load(ENTRY);
  }
  start(mode: "solo" | "versus" = this.mode) {
    this.reset(mode);
    this.phase = "playing";
  }
  pause() {
    if (this.phase === "playing") this.phase = "paused";
    else if (this.phase === "paused") this.phase = "playing";
  }
  private say(index: number, text: string, move: MoveId) {
    const line: Line = {
      serial: ++this.serial,
      fighter: this.fighters[index].id,
      move,
      text,
      topic: "reason",
    };
    this.dialogue.history.push(line);
  }
  private load(id: string) {
    this.nodeId = id;
    this.stage = "select";
    this.options = this.shuffled(this.node.choices);
    this.answers = [];
    this.selection = 0;
    this.reviewZone = "high";
    this.reviewing = false;
    this.reviewSteps = 0;
    this.selected = null;
    this.answered = null;
    this.result = "";
    this.explanation = "";
    this.remaining = 0;
    this.aiElapsed = 0;
    this.guardLinger = 0;
    this.defenseAt = Infinity;
    this.lastDefense = null;
    this.lastDamage = 0;
    this.fighters.forEach((f, i) => {
      f.x = i ? 660 : 300;
      f.y = 425;
      f.active = 0;
      f.guard = false;
      f.crouch = false;
      f.stance = i === this.defender;
      f.guardZone = "high";
    });
    this.say(
      this.defender,
      this.node.claim.high,
      this.defender ? "identity" : "cause",
    );
  }
  review() {
    if (
      this.phase === "playing" &&
      (this.stage === "select" || this.stage === "answer")
    ) {
      const zones: Zone[] = ["high", "middle", "low"];
      if (this.stage === "answer") {
        this.reviewSteps = (this.reviewSteps + 1) % 4;
        this.reviewing = this.reviewSteps !== 0;
        if (this.reviewing) this.reviewZone = zones[this.reviewSteps - 1];
      } else this.reviewZone = zones[(zones.indexOf(this.reviewZone) + 1) % 3];
    }
  }
  choose(index: number) {
    if (this.phase !== "playing" || index < 0 || index > 2) return;
    if (this.stage === "select") {
      this.selected = this.options[index];
      this.selection = index;
      this.answers = this.shuffled(this.selected.answers);
      this.stage = "windup";
      this.remaining = WINDUP;
      this.aiElapsed = 0;
      this.defenseAt = Infinity;
      this.guardLinger = 0;
      this.aiHasDefended = false;
      const r = this.random();
      this.aiDefense = r < 0.35 ? "parry" : r < 0.8 ? "block" : "hit";
      const f = this.fighters[this.attacker];
      f.move = this.selected.move;
      f.active = WINDUP + 0.35;
      f.stance = false;
      this.say(this.attacker, this.selected.text, this.selected.move);
    } else if (this.stage === "answer") {
      const answer = this.answers[index];
      this.answered = answer;
      this.selection = index;
      const f = this.fighters[this.defender];
      if (answer.quality === 0)
        f.pressure = Math.min(
          3,
          f.pressure + (this.selected!.strength >= 2 ? 2 : 1),
        );
      else if (
        answer.kind === "concede" ||
        answer.quality >= this.selected!.strength
      )
        f.pressure = Math.max(0, f.pressure - 1);
      else f.pressure = Math.min(3, f.pressure + 1);
      f.move =
        answer.kind === "concede"
          ? f.id === "buddha"
            ? "release"
            : "rights"
          : f.id === "buddha"
            ? "mindful"
            : "premises";
      f.active = 0.8;
      this.say(this.defender, answer.text, f.move);
      this.explanation = `${this.selected!.explanation} ${answer.explanation}`;
      this.result =
        answer.kind === "evade"
          ? "Objection unanswered · guard weakened"
          : answer.kind === "concede"
            ? "Claim revised · pressure released"
            : "Objection addressed";
      this.stage = "continue";
      this.aiElapsed = 0;
    }
  }
  defend(zone: Zone) {
    if (this.phase !== "playing" || this.stage !== "windup") return;
    this.defenseAt = this.remaining;
    this.defenseZone = zone;
    this.guardLinger = 0.28;
    const f = this.fighters[this.defender];
    f.guard = true;
    f.guardZone = zone;
  }
  advance() {
    if (this.phase !== "playing" || this.stage !== "continue" || !this.answered)
      return;
    if (
      this.exchange >= MAX_EXCHANGES ||
      this.fighters.some((f) => f.hp === 0)
    ) {
      this.finish();
      return;
    }
    const next = this.answered.next;
    this.exchange++;
    this.load(next);
  }
  private finish() {
    this.phase = "finished";
    const [a, b] = this.fighters;
    this.winner = a.hp === b.hp ? "draw" : a.hp > b.hp ? a.id : b.id;
  }
  private effect(kind: Effect["kind"], target: Fighter, zone: Zone) {
    this.effects.push({
      id: ++this.serial,
      kind,
      x: target.x,
      y: target.y - (zone === "high" ? 118 : zone === "middle" ? 65 : 20),
      color: ROSTER[target.id].color,
      life: 0.6,
    });
  }
  private impact() {
    const choice = this.selected!,
      f = this.fighters[this.defender];
    const parry =
      this.defenseAt <= PARRY_WINDOW && this.defenseZone === choice.target;
    const block = !parry && f.guard && f.guardZone === choice.target;
    this.lastDefense = parry ? "parry" : block ? "block" : "hit";
    const base = 8 + choice.strength * 4 + f.pressure * 3;
    this.lastDamage = parry ? 0 : block ? Math.ceil(base * 0.3) : base;
    f.hp = Math.max(0, f.hp - this.lastDamage);
    f.hit = parry ? 0 : 0.35;
    this.effect(parry ? "dodge" : block ? "block" : "hit", f, choice.target);
    this.result = parry
      ? "Parried · now answer the objection"
      : block
        ? `Blocked · ${this.lastDamage} damage`
        : `${this.lastDamage} damage · ${choice.strength === 0 ? "The challenge missed the argument" : "The challenge found its target"}`;
    this.projectiles = [];
    this.stage = "impact";
    this.remaining = 1.6;
  }
  tick(dt: number, p1: Input, p2: Input = emptyInput()) {
    if (this.phase !== "playing") return;
    dt = Math.min(dt, 0.04);
    this.aiElapsed += dt;
    this.guardLinger = Math.max(0, this.guardLinger - dt);
    for (const f of this.fighters) {
      f.active = Math.max(0, f.active - dt);
      f.hit = Math.max(0, f.hit - dt);
    }
    this.effects = this.effects.filter((e) => {
      e.life -= dt;
      return e.life > 0;
    });
    const inputs = [p1, p2],
      actorInput = inputs[this.actor],
      previous = this.fighters[this.actor].previous;
    if (this.stage === "select" || this.stage === "answer") {
      // Reading has no countdown. Each tap changes one option; holding does not race through them.
      if (this.humanTurn) {
        if (
          (actorInput.down && !previous.down) ||
          (actorInput.right && !previous.right)
        )
          this.selection = (this.selection + 1) % 3;
        if (
          (actorInput.up && !previous.up) ||
          (actorInput.left && !previous.left)
        )
          this.selection = (this.selection + 2) % 3;
        if (actorInput.a && !previous.a) this.choose(this.selection);
      } else if (this.aiElapsed > (this.stage === "select" ? 4 : 2.8)) {
        const pool = this.stage === "select" ? this.options : this.answers;
        const scores = pool.map((item) =>
          "strength" in item ? item.strength : item.quality,
        );
        const best = scores.indexOf(Math.max(...scores));
        this.choose(
          this.random() < 0.75 ? best : Math.floor(this.random() * 3),
        );
      }
      if (inputs.some((input, i) => input.b && !this.fighters[i].previous.b))
        this.review();
    } else if (this.stage === "windup") {
      const f = this.fighters[this.defender],
        input = inputs[this.defender];
      if (this.mode === "solo" && this.defender === 1) {
        if (
          !this.aiHasDefended &&
          ((this.aiDefense === "parry" && this.remaining < 0.26) ||
            (this.aiDefense === "block" && this.remaining < 0.8))
        ) {
          this.defend(this.selected!.target);
          this.aiHasDefended = true;
        }
        f.guard =
          (this.aiDefense === "block" && this.aiHasDefended) ||
          this.guardLinger > 0;
      } else {
        if (input.up) f.guardZone = "high";
        else if (input.down) f.guardZone = "low";
        else if (input.b) f.guardZone = "middle";
        f.guard = input.b || this.guardLinger > 0;
        if (input.b && !f.previous.b) this.defend(f.guardZone);
      }
      f.crouch = f.guardZone === "low";
      f.stance = true;
      const progress = 1 - this.remaining / WINDUP,
        attacker = this.fighters[this.attacker],
        from = this.attacker ? 660 : 300;
      attacker.x =
        from +
        (f.x - attacker.facing * 100 - from) *
          Math.max(0, Math.min(1, (progress - 0.25) / 0.75));
      if (this.selected!.target === "middle")
        this.projectiles = [
          {
            owner: this.attacker,
            x: from + (f.x - from) * progress,
            y: f.y - 65,
            direction: attacker.facing,
            life: this.remaining,
          },
        ];
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining === 0) this.impact();
    } else if (this.stage === "impact") {
      this.fighters.forEach((f, i) => {
        f.x += ((i ? 660 : 300) - f.x) * Math.min(1, dt * 5);
      });
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining === 0) {
        if (this.fighters.some((f) => f.hp === 0)) this.finish();
        else {
          this.stage = "answer";
          this.selection = 0;
          this.aiElapsed = 0;
        }
      }
    } else if (this.stage === "continue") {
      if (
        (p1.a && !this.fighters[0].previous.a) ||
        (p2.a && !this.fighters[1].previous.a)
      )
        this.advance();
    }
    this.fighters.forEach((f, i) => {
      f.previous = { ...inputs[i] };
    });
  }
}
