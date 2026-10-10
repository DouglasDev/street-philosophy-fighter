import { DEBATE } from "./debate";
import { GameScreen } from "./GameScreen";
import { snapshot } from "./view";
import { layoutFixture } from "./layoutFixtures";
import { CABINET_WIDTH, CABINET_HEIGHT } from "./display";

export function LayoutChecks() {
  const cases: string[] = ["ready", "paused", "finished", "draw", "finished&winner=rand"];
  for (const node of Object.values(DEBATE)) {
    cases.push(`select&node=${node.id}`);
    for (const zone of ["high", "middle", "low"]) cases.push(`select&node=${node.id}&zone=${zone}`);
    node.choices.forEach((_, choice) => {
      cases.push(`answer&node=${node.id}&choice=${choice}`);
      for (const zone of ["high", "middle", "low"]) cases.push(`answer&node=${node.id}&choice=${choice}&review=1&zone=${zone}`);
      for (const answer of ["defend", "concede", "evade"]) cases.push(`continue&node=${node.id}&choice=${choice}&answer=${answer}`);
    });
  }
  for (let choice = 0; choice < 3; choice++) {
    cases.push(`windup&choice=${choice}`, `windup&choice=${choice}&parry=1`);
  }
  for (const defense of ["hit", "block", "parry"]) cases.push(`impact&defense=${defense}`);
  return <div aria-label="Cabinet layout checks">
    {cases.map(id => {
      const match = layoutFixture(new URLSearchParams(`layout-case=${id}`));
      const view = { ...snapshot(match), positions: [], width: CABINET_WIDTH, height: CABINET_HEIGHT };
      return <section key={id} data-case={id} style={{ position: "relative", width: 336, height: 262, background: "#152932" }}>
        <GameScreen view={view} sound={false} setSound={() => {}} />
      </section>;
    })}
  </div>;
}
