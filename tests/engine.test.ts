import { test } from "node:test";
import assert from "node:assert/strict";
import { Match, emptyInput, WINDUP } from "../src/engine.ts";
import { DEBATE, MAX_EXCHANGES } from "../src/debate.ts";
const game = () => {
  const m = new Match(() => 0.999);
  m.start("versus");
  return m;
};
function until(m: Match, stage: string) {
  for (let i = 0; i < 300 && m.stage !== stage && m.phase === "playing"; i++)
    m.tick(0.02, emptyInput());
  assert.equal(m.stage, stage);
}
function parry(m: Match) {
  while (m.remaining > 0.2) m.tick(0.02, emptyInput());
  m.defend(m.selected!.target);
  until(m, "answer");
}

test("all authored branches exist, switch claimant, and offer three replies", () => {
  for (const node of Object.values(DEBATE)) {
    assert.equal(node.choices.length, 3);
    for (const c of node.choices) {
      assert.equal(c.answers.length, 3);
      assert.ok(c.strength >= 0 && c.strength <= 3);
      for (const a of c.answers) {
        assert.ok(DEBATE[a.next], `${node.id}: missing ${a.next}`);
        assert.notEqual(DEBATE[a.next].claimant, node.claimant);
      }
    }
  }
  const reachable = new Set<string>(),
    queue = ["purpose"];
  while (queue.length) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const c of DEBATE[id].choices)
      for (const a of c.answers) queue.push(a.next);
  }
  assert.equal(reachable.size, Object.keys(DEBATE).length);
});
test("reading has no timer; navigation is edge-triggered and A commits the chosen challenge", () => {
  const m = game();
  for (let i = 0; i < 1000; i++) m.tick(0.04, emptyInput());
  assert.equal(m.stage, "select");
  assert.equal(m.fighters[0].hp, 100);
  for (let i = 0; i < 30; i++) m.tick(0.02, { ...emptyInput(), down: true });
  assert.equal(m.selection, 1);
  m.tick(0.02, { ...emptyInput(), a: true });
  assert.equal(m.selected?.id, m.options[1].id);
  assert.equal(m.stage, "windup");
});
test("a late defense of the correct zone parries; a late defense of the wrong zone does not", () => {
  const m = game();
  m.choose(0);
  parry(m);
  assert.equal(m.lastDefense, "parry");
  assert.equal(m.lastDamage, 0);
  const n = game();
  n.choose(0);
  while (n.remaining > 0.2) n.tick(0.02, emptyInput());
  n.defend(n.selected!.target === "high" ? "low" : "high");
  until(n, "answer");
  assert.equal(n.lastDefense, "hit");
  assert.equal(n.fighters[1].hp, 80);
});
test("an early held defense blocks but does not receive the timing bonus", () => {
  const m = game();
  m.choose(0);
  const input = { ...emptyInput(), b: true, down: true };
  while (m.stage === "windup") m.tick(0.02, emptyInput(), input);
  assert.equal(m.lastDefense, "block");
  assert.equal(m.lastDamage, 6);
});
test("rebuttal relevance changes damage and argument pressure amplifies later attacks", () => {
  const strong = game();
  strong.choose(0);
  until(strong, "answer");
  assert.equal(strong.lastDamage, 20);
  const weak = game();
  weak.choose(2);
  until(weak, "answer");
  assert.equal(weak.lastDamage, 8);
  const pressured = game();
  pressured.fighters[1].pressure = 2;
  pressured.choose(0);
  until(pressured, "answer");
  assert.equal(pressured.lastDamage, 26);
});
test("physical parries still require an answer, and an evasive answer weakens the guard", () => {
  const m = game();
  m.choose(0);
  parry(m);
  assert.equal(m.fighters[1].hp, 100);
  m.choose(m.answers.findIndex((a) => a.quality === 0));
  assert.equal(m.fighters[1].pressure, 2);
  assert.equal(m.stage, "continue");
  assert.match(m.result, /unanswered/);
});
test("a concession changes the next claim and can release accumulated pressure", () => {
  const m = game();
  m.fighters[1].pressure = 2;
  m.choose(0);
  parry(m);
  m.choose(m.answers.findIndex((a) => a.kind === "concede"));
  assert.equal(m.answered?.next, "practice");
  assert.equal(m.fighters[1].pressure, 1); // Conceding revises the claim and releases pressure.
  m.advance();
  assert.equal(m.nodeId, "practice");
  assert.equal(m.defender, 0);
  assert.equal(m.attacker, 1);
  assert.equal(m.exchange, 2);
  const n = game();
  n.choose(2);
  parry(n);
  n.fighters[1].pressure = 2;
  n.choose(n.answers.findIndex((a) => a.kind === "concede"));
  assert.equal(n.fighters[1].pressure, 1);
});
test("pause freezes the attack, and restart clears choices, pressure, and health", () => {
  const m = game();
  m.choose(0);
  m.pause();
  for (let i = 0; i < 100; i++) m.tick(0.04, emptyInput());
  assert.equal(m.remaining, WINDUP);
  m.fighters[0].hp = 50;
  m.fighters[0].pressure = 3;
  m.start();
  assert.equal(m.stage, "select");
  assert.equal(m.fighters[0].hp, 100);
  assert.equal(m.fighters[0].pressure, 0);
  assert.equal(m.dialogue.history.length, 1);
});
test("the round ends after twelve exchanges; human reading never auto-advances", () => {
  const m = game();
  for (let turn = 0; turn < MAX_EXCHANGES; turn++) {
    m.choose(0);
    parry(m);
    m.choose(m.answers.findIndex((a) => a.quality === 3));
    for (let i = 0; i < 100; i++) m.tick(0.04, emptyInput());
    assert.equal(m.stage, "continue");
    m.advance();
  }
  assert.equal(m.phase, "finished");
  assert.equal(m.winner, "draw");
});
test("solo computer replies and takes its own attacking turn", () => {
  const m = new Match(() => 0.5);
  m.start("solo");
  m.choose(0);
  for (let i = 0; i < 400 && m.stage !== "continue"; i++)
    m.tick(0.02, emptyInput());
  assert.equal(m.stage, "continue");
  m.advance();
  assert.equal(m.attacker, 1);
  for (let i = 0; i < 220 && m.stage === "select"; i++)
    m.tick(0.02, emptyInput());
  assert.equal(m.stage, "windup");
});
