import { useEffect, useRef, useState } from "react";
import { styled } from "@linaria/react";
import * as Phaser from "phaser";
import { Arena } from "./arena";
import { CABINET_WIDTH, CABINET_HEIGHT } from "./display";
import { Match } from "./engine";
import { snapshot } from "./view";
import type { View } from "./view";
import { GameScreen } from "./GameScreen";
import arenaBackground from "./assets/arena-background.svg";
const Stage = styled.main`
  position: fixed; inset: 0; width: 336px; height: 262px;
  overflow: hidden; background: #152932;
  canvas { display: block; }
`;
const Background = styled.img`
  position: absolute; inset: 0; width: 336px; height: 262px;
  pointer-events: none;
`;
const Canvas = styled.div`
  position: absolute; inset: 0;
`;
const initial: View = { ...snapshot(new Match()), positions: [], width: CABINET_WIDTH, height: CABINET_HEIGHT };
export function App() {
  const host = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(initial);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const scene = new Arena((m, projection) => setView({ ...snapshot(m), ...projection }));
    const game = new Phaser.Game({
      type: Phaser.CANVAS, parent: host.current,
      width: CABINET_WIDTH, height: CABINET_HEIGHT, transparent: true,
      scale: { mode: Phaser.Scale.NONE }, scene: [scene], audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false }, banner: false,
    });
    return () => game.destroy(true);
  }, []);
  return <Stage aria-label="Offline debate fighting arena">
    {!(view.phase === "playing" && ["select", "answer", "continue"].includes(view.stage)) &&
      <Background src={arenaBackground} alt="" aria-hidden="true" />}
    <Canvas ref={host} /><GameScreen view={view} sound={sound} setSound={setSound} />
  </Stage>;
}
