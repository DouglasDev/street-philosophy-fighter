import { DEBATE } from "./debate";
import type { Zone } from "./debate";
import { Match, emptyInput } from "./engine";

// Development-only snapshots freeze real match states for cabinet layout checks.
export function layoutFixture(params: URLSearchParams): Match {
  const match = new Match(() => 0.999);
  match.start("versus");
  const stage = params.get("layout-case") ?? "select";
  const node = DEBATE[params.get("node") ?? "purpose"] ?? DEBATE.purpose;
  match.nodeId = node.id;
  match.options = [...node.choices];
  match.reviewZone = (params.get("zone") ?? "high") as Zone;
  if (stage === "ready") return new Match();
  if (stage === "finished" || stage === "draw") {
    match.phase = "finished";
    match.winner = stage === "draw" ? "draw" : params.get("winner") === "rand" ? "rand" : "buddha";
    return match;
  }
  if (stage === "select") {
    match.reviewing = params.has("zone");
    return match;
  }
  match.choose(Number(params.get("choice") ?? 0));
  if (stage === "windup" || stage === "paused") {
    match.remaining = params.has("parry") ? 0.2 : 0.9;
    if (stage === "paused") match.pause();
    return match;
  }
  const defense = params.get("defense");
  const guard = { ...emptyInput(), b: defense === "block",
    up: match.selected?.target === "high", down: match.selected?.target === "low" };
  for (let i = 0; i < 200 && match.stage !== "impact"; i++) {
    if (defense === "parry" && match.remaining <= 0.2) match.defend(match.selected!.target);
    match.tick(0.02, match.defender === 0 ? guard : emptyInput(),
      match.defender === 1 ? guard : emptyInput());
  }
  if (stage === "impact") return match;
  for (let i = 0; i < 200 && match.stage !== "answer"; i++) match.tick(0.02, emptyInput());
  match.reviewing = params.has("review");
  if (stage === "continue") {
    match.choose(match.answers.findIndex(answer => answer.kind === (params.get("answer") ?? "defend")));
  }
  return match;
}
