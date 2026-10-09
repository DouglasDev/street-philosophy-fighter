import * as Phaser from "phaser";
import { Match, emptyInput } from "./engine.ts";
import { WINDUP } from "./engine.ts";
import type { Zone } from "./debate.ts";
import type { Input, Fighter } from "./engine.ts";
export interface Controls {
  p1: Input;
  p2: Input;
  pending1: Input;
  pending2: Input;
  start: 0 | 1 | 2;
  pause: boolean;
  sound: boolean;
  choice: number;
  advance: boolean;
  review: boolean;
  defense: Zone | null;
}
export const controls: Controls = {
  p1: emptyInput(),
  p2: emptyInput(),
  pending1: emptyInput(),
  pending2: emptyInput(),
  start: 0,
  pause: false,
  sound: false,
  choice: -1,
  advance: false,
  review: false,
  defense: null,
};
let audio: AudioContext | undefined;
function tone(high: boolean) {
  if (!controls.sound) return;
  audio ??= new AudioContext();
  void audio.resume();
  const oscillator = audio.createOscillator(),
    gain = audio.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(high ? 440 : 100, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    high ? 220 : 45,
    audio.currentTime + 0.12,
  );
  gain.gain.setValueAtTime(0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.17);
}
export function releaseControls() {
  Object.assign(controls.p1, emptyInput());
  Object.assign(controls.p2, emptyInput());
  Object.assign(controls.pending1, emptyInput());
  Object.assign(controls.pending2, emptyInput());
}
export interface ArenaProjection {
  positions: { x: number; y: number }[];
  width: number;
  height: number;
}
export class Arena extends Phaser.Scene {
  match = new Match();
  private ink!: Phaser.GameObjects.Graphics;
  private scenery!: Phaser.GameObjects.Graphics;
  private worldWidth = 960;
  private worldHeight = 600;
  private originX = 0;
  private originY = 0;
  private zoom = 1;
  private elapsed = 0;
  private lastUi = 0;
  private lastEffect = 0;
  private pressed = new Set<string>();
  private pendingKeys = new Set<string>();
  private arcade:
    | {
        PLAYER_1: { DPAD: Omit<Input, "a" | "b">; A: boolean; B: boolean };
        PLAYER_2: { DPAD: Omit<Input, "a" | "b">; A: boolean; B: boolean };
        SYSTEM: { ONE_PLAYER: boolean; TWO_PLAYER: boolean };
      }
    | undefined;
  constructor(
    private publish: (match: Match, projection: ArenaProjection) => void,
  ) {
    super("arena");
  }
  create() {
    this.scenery = this.add.graphics();
    this.ink = this.add.graphics();
    this.layout();
    this.scale.on("resize", this.layout, this);
    const down = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
      )
        return;
      const k = event.key.toLowerCase();
      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
          "w",
          "a",
          "s",
          "d",
          "f",
          "g",
          "z",
          "x",
          "i",
          "j",
          "k",
          "l",
          ";",
          "'",
          "1",
          "2",
          "escape",
          "enter",
        ].includes(k)
      ) {
        event.preventDefault();
        if (!event.repeat) {
          if (k === "1" || k === "enter") controls.start = 1;
          if (k === "2") controls.start = 2;
          if (k === "escape") controls.pause = true;
        }
        this.pressed.add(k);
        if (!event.repeat) this.pendingKeys.add(k);
      }
    };
    const up = (event: KeyboardEvent) =>
      this.pressed.delete(event.key.toLowerCase());
    const blur = () => {
      this.pressed.clear();
      this.pendingKeys.clear();
      releaseControls();
      if (this.match.phase === "playing") this.match.pause();
      this.publishMatch();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      releaseControls();
      this.scale.off("resize", this.layout, this);
    });
    if (window.parent !== window)
      void import("@rcade/plugin-input-classic")
        .then((module) => {
          this.arcade = module;
        })
        .catch(() => {
          /* Keyboard and gamepad remain available outside RCade. */
        });
    this.publishMatch();
  }
  private readInput(index: number): Input {
    const k = {
        has: (key: string) =>
          this.pressed.has(key) || this.pendingKeys.has(key),
      },
      external = index ? controls.p2 : controls.p1,
      pending = index ? controls.pending2 : controls.pending1;
    const keys = index
      ? { up: "i", down: "k", left: "j", right: "l", a: ";", b: "'" }
      : { up: "w", down: "s", left: "a", right: "d", a: "f", b: "g" };
    const result = emptyInput();
    for (const name of Object.keys(result) as (keyof Input)[])
      result[name] =
        external[name] ||
        pending[name] ||
        k.has(keys[name]) ||
        (!index &&
          k.has(
            (
              {
                up: "arrowup",
                down: "arrowdown",
                left: "arrowleft",
                right: "arrowright",
                a: "z",
                b: "x",
              } as const
            )[name],
          ));
    const pad = [...navigator.getGamepads()].filter(Boolean)[index];
    if (pad) {
      result.left ||= pad.axes[0] < -0.3 || !!pad.buttons[14]?.pressed;
      result.right ||= pad.axes[0] > 0.3 || !!pad.buttons[15]?.pressed;
      result.up ||= pad.axes[1] < -0.5 || !!pad.buttons[12]?.pressed;
      result.down ||= pad.axes[1] > 0.5 || !!pad.buttons[13]?.pressed;
      result.a ||= !!pad.buttons[0]?.pressed;
      result.b ||= !!pad.buttons[1]?.pressed;
    }
    const arcade = index ? this.arcade?.PLAYER_2 : this.arcade?.PLAYER_1;
    if (arcade) {
      for (const name of ["left", "right", "up", "down"] as const)
        result[name] ||= arcade.DPAD[name];
      result.a ||= arcade.A;
      result.b ||= arcade.B;
    }
    return result;
  }
  update(_time: number, delta: number) {
    if (controls.start) {
      this.match.start(controls.start === 2 ? "versus" : "solo");
      controls.start = 0;
      this.lastEffect = 0;
    }
    if (this.arcade?.SYSTEM.ONE_PLAYER && this.match.phase !== "playing")
      this.match.start("solo");
    if (this.arcade?.SYSTEM.TWO_PLAYER && this.match.phase !== "playing")
      this.match.start("versus");
    if (controls.choice >= 0) {
      if (this.match.humanTurn) this.match.choose(controls.choice);
      controls.choice = -1;
    }
    if (controls.advance) {
      this.match.advance();
      controls.advance = false;
    }
    if (controls.review) {
      this.match.review();
      controls.review = false;
    }
    if (controls.defense) {
      this.match.defend(controls.defense);
      controls.defense = null;
    }
    if (controls.pause) {
      this.match.pause();
      controls.pause = false;
    }
    const dt = Math.min(delta / 1000, 0.04);
    if (this.match.phase === "playing") this.elapsed += dt;
    this.match.tick(dt, this.readInput(0), this.readInput(1));
    this.pendingKeys.clear();
    Object.assign(controls.pending1, emptyInput());
    Object.assign(controls.pending2, emptyInput());
    this.draw();
    const latest = this.match.effects.at(-1);
    if (latest && latest.id > this.lastEffect) {
      this.lastEffect = latest.id;
      if (latest.kind === "hit") tone(false);
      else if (latest.kind === "cast") tone(true);
    }
    if (_time - this.lastUi > 70) {
      this.lastUi = _time;
      this.publishMatch();
    }
  }
  private publishMatch() {
    this.publish(this.match, {
      width: this.scale.width,
      height: this.scale.height,
      positions: this.match.fighters.map((f) => ({
        x: (f.x + this.originX) * this.zoom,
        y: (f.y - 155 + this.originY) * this.zoom,
      })),
    });
  }
  private layout() {
    const width = this.scale.width,
      height = this.scale.height;
    this.zoom = Math.min(width / 960, height / 450);
    this.worldWidth = width / this.zoom;
    this.worldHeight = height / this.zoom;
    this.originX = (this.worldWidth - 960) / 2;
    this.originY = this.worldHeight * 0.66 - 425;
    this.cameras.main
      .setZoom(this.zoom)
      .centerOn(this.worldWidth / 2, this.worldHeight / 2);
    this.ink.setPosition(this.originX, this.originY);
    this.scenery.setPosition(this.originX, this.originY);
    this.background();
    this.publishMatch();
  }
  private background() {
    const g = this.scenery;
    g.clear();
    g.fillGradientStyle(0x152932, 0x252733, 0x0c151c, 0x131b22, 1);
    g.fillRect(-this.originX, -this.originY, this.worldWidth, this.worldHeight);
    g.fillStyle(0x8be0c1, 0.035);
    g.fillCircle(265, 245, 230);
    g.fillStyle(0xffb36b, 0.035);
    g.fillCircle(740, 245, 230);
    g.fillStyle(0xefe0b9, 0.7);
    g.fillCircle(478, 157, 47);
    g.fillStyle(0x172731, 1);
    g.fillCircle(494, 143, 46);
    for (let i = 0; i < 62; i++) {
      const x = (i * 167 + 41) % 960,
        y = 80 + ((i * 97) % 225);
      g.fillStyle(0xe0d4b5, i % 3 === 0 ? 0.4 : 0.14);
      g.fillCircle(x, y, i % 6 === 0 ? 1.4 : 0.7);
    }
    // Temple silhouettes and a geometric city meet at the horizon.
    g.fillStyle(0x213b3b, 0.8);
    g.fillRect(48, 242, 288, 181);
    g.fillTriangle(20, 255, 192, 159, 365, 255);
    g.fillStyle(0x33534b, 0.6);
    g.fillTriangle(29, 248, 192, 173, 356, 248);
    for (const x of [74, 128, 245, 299]) {
      g.fillStyle(0x0f262b, 1);
      g.fillRect(x, 261, 22, 162);
      g.fillStyle(0x34534d, 0.6);
      g.fillRect(x, 261, 4, 162);
      g.fillRect(x - 5, 257, 32, 8);
    }
    g.fillStyle(0x13282e, 1);
    g.fillRect(154, 284, 78, 139);
    g.fillStyle(0x5b8d75, 0.14);
    g.fillCircle(192, 319, 29);
    for (let i = 0; i < 7; i++) {
      const x = 591 + i * 53,
        h = 95 + ((i * 67) % 125);
      g.fillStyle(i % 2 ? 0x2e3338 : 0x252e36, 1);
      g.fillRect(x, 425 - h, 44, h);
      g.lineStyle(1, 0xa88962, 0.2);
      g.lineBetween(x, 425 - h, x + 44, 425 - h);
      for (let y = 438 - h; y < 420; y += 18) {
        g.fillStyle(0xcda271, 0.15);
        g.fillRect(x + 10, y, 4, 6);
        g.fillRect(x + 29, y, 4, 6);
      }
    }
    g.fillStyle(0x0c191f, 1);
    const floorBottom = this.worldHeight - this.originY;
    g.fillRect(-this.originX, 423, this.worldWidth, floorBottom - 423);
    g.lineStyle(2, 0xcac1a0, 0.4);
    g.lineBetween(-this.originX, 425, 960 + this.originX, 425);
    g.lineStyle(1, 0x4e7065, 0.25);
    for (let x = -400 - this.originX; x < 1400 + this.originX; x += 100)
      g.lineBetween(480 + (x - 480) * 0.5, 427, x, floorBottom);
    for (let y = 438; y < floorBottom; y += 24)
      g.lineBetween(-this.originX, y, 960 + this.originX, y);
  }
  private draw() {
    const g = this.ink;
    g.clear();
    this.match.fighters.forEach((f, i) => this.fighter(g, f, i));
    for (const p of this.match.projectiles) {
      const c = p.owner ? 0xffb66f : 0x91e0c6;
      g.fillStyle(c, 0.08);
      g.fillCircle(p.x, p.y, 30);
      g.lineStyle(2, c, 0.85);
      if (p.owner) {
        g.strokeRect(p.x - 10, p.y - 10, 20, 20);
        g.lineBetween(p.x - p.direction * 30, p.y, p.x, p.y);
      } else {
        g.strokeCircle(p.x, p.y, 14);
        g.strokeCircle(p.x, p.y, 7);
        g.lineBetween(p.x - p.direction * 30, p.y, p.x, p.y);
      }
    }
    for (const e of this.match.effects) {
      const alpha = Math.max(0, Math.min(1, e.life / 0.6)),
        r = (1 - alpha) * 60 + 10,
        c = Phaser.Display.Color.HexStringToColor(e.color).color;
      g.lineStyle(e.kind === "hit" ? 3 : 1.5, c, alpha);
      g.strokeCircle(e.x, e.y, r);
      if (e.kind === "hit") {
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          g.lineBetween(
            e.x + Math.cos(a) * r * 0.6,
            e.y + Math.sin(a) * r * 0.6,
            e.x + Math.cos(a) * r * 1.25,
            e.y + Math.sin(a) * r * 1.25,
          );
        }
      }
    }
  }
  private fighter(g: Phaser.GameObjects.Graphics, f: Fighter, index: number) {
    const time = this.elapsed,
      x = f.x,
      y = f.y,
      dir = f.facing,
      c = index ? 0xffb66f : 0x91e0c6;
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(x, 430, 92, 13);
    const phase = f.active > 0 ? 1 : 0,
      meditating =
        f.active > 0 && (f.move === "mindful" || f.move === "premises"),
      crouch = f.crouch ? 20 : 0;
    const bob = f.y < 425 ? 0 : Math.sin(time * 3 + index) * 2;
    const headY = y - 118 + bob + crouch + (meditating ? 20 : 0);
    const invisible = f.move === "release" && f.immune > 0;
    const alpha = invisible ? 0.24 : 1;
    if (f.active > 0 || f.guard) {
      g.lineStyle(1, c, 0.25);
      g.strokeCircle(x, y - 69, 64 + Math.sin(time * 7) * 3);
      g.lineStyle(2, c, 0.12);
      g.strokeCircle(x, y - 69, 72);
    }
    if (f.hit > 0) {
      g.fillStyle(0xffffff, f.hit * 2);
      g.fillCircle(x, y - 65, 47);
    }
    g.fillStyle(index ? 0x24252d : 0x354a42, alpha);
    if (index) {
      g.fillStyle(0x1a1c27, alpha);
      g.fillTriangle(
        x - 20,
        y - 53 + crouch,
        x + 23,
        y - 53 + crouch,
        x + 30,
        y - 4,
      );
      g.fillTriangle(x - 20, y - 53 + crouch, x - 30, y - 4, x - 5, y - 4);
      g.lineStyle(4, 0x0c111b, alpha);
      g.lineBetween(x - 23, y - 4, x - 40, y - 2);
      g.lineBetween(x + 20, y - 4, x + 35, y - 2);
      g.fillStyle(0x61453c, alpha);
      g.fillTriangle(
        x - 26,
        headY + 23,
        x + 24,
        headY + 23,
        x + 33,
        y - 48 + crouch,
      );
      g.fillTriangle(
        x - 26,
        headY + 23,
        x + 33,
        y - 48 + crouch,
        x - 29,
        y - 48 + crouch,
      );
      g.fillStyle(0xe3d4b6, alpha);
      g.fillTriangle(
        x - 10,
        headY + 23,
        x + 10,
        headY + 23,
        x + 2,
        y - 56 + crouch,
      );
      g.lineStyle(3, 0xb47d50, alpha);
      g.lineBetween(x - 21, headY + 28, x - 8, y - 58 + crouch);
      g.lineBetween(x + 22, headY + 28, x + 6, y - 58 + crouch);
    } else {
      g.fillStyle(0x8e5933, alpha);
      g.fillTriangle(x - 23, headY + 22, x + 27, headY + 22, x + 47, y - 5);
      g.fillTriangle(x - 23, headY + 22, x + 47, y - 5, x - 45, y - 5);
      g.fillStyle(0xbe8444, alpha);
      g.fillTriangle(x + 13, headY + 19, x - 17, y - 12, x + 35, y - 10);
      g.lineStyle(2, 0xe1b56f, 0.6 * alpha);
      g.lineBetween(x + 13, headY + 24, x - 15, y - 10);
      g.lineStyle(3, 0x694429, alpha);
      g.lineBetween(x - 14, headY + 48, x - 25, y - 12);
      g.lineBetween(x + 14, headY + 50, x + 28, y - 12);
      g.fillStyle(0xbb9874, alpha);
      g.fillEllipse(x - 24, y - 3, 25, 9);
      g.fillEllipse(x + 25, y - 3, 25, 9);
    }
    g.fillStyle(0xc5a081, alpha);
    g.fillRoundedRect(x - 8, headY + 8, 16, 22, 4);
    g.fillEllipse(x, headY, 34, 42);
    if (index) {
      g.fillStyle(0x24222c, alpha);
      g.fillEllipse(x, headY - 11, 42, 25);
      g.fillRoundedRect(x - 23, headY - 12, 10, 36, 4);
      g.fillRoundedRect(x + 14, headY - 12, 10, 36, 4);
      g.lineStyle(1, 0x9f6c49, alpha);
      g.lineBetween(x - 14, headY - 19, x + 8, headY - 19);
    } else {
      g.fillStyle(0x202d31, alpha);
      g.fillCircle(x, headY - 25, 12);
      g.fillCircle(x, headY - 32, 6);
      g.fillStyle(0xe6c398, alpha);
      g.fillCircle(x, headY - 6, 1.5);
    }
    g.lineStyle(1.5, 0x44352e, alpha);
    g.lineBetween(x + dir * 5, headY - 2, x + dir * 12, headY - 2);
    g.lineBetween(x + dir * 5, headY + 10, x + dir * 11, headY + 10);
    const handX =
        x +
        dir *
          (meditating ? 15 : phase && MOVEOFFENSE(f) ? 78 : f.stance ? 47 : 36),
      handY = f.stance
        ? f.guardZone === "high"
          ? headY - 15
          : f.guardZone === "low"
            ? y - 30
            : headY + 35
        : this.match.stage === "windup" &&
            this.match.selected?.target === "high"
          ? headY - 35 + (1 - this.match.remaining / WINDUP) * 80
          : meditating
            ? y - 55 + crouch
            : headY + (phase ? 30 : 52);
    g.lineStyle(12, index ? 0x61453c : 0xa56c36, alpha);
    g.lineBetween(x + dir * 20, headY + 30, handX - dir * 12, handY);
    g.fillStyle(0xc5a081, alpha);
    g.fillCircle(handX, handY, 7);
    if (
      this.match.stage === "windup" &&
      f.id === this.match.fighters[this.match.attacker].id &&
      this.match.selected?.target === "low"
    ) {
      g.lineStyle(14, index ? 0x24252d : 0x8e5933, alpha);
      g.lineBetween(x, y - 38, x + dir * 85, y - 18);
      g.fillStyle(0xc5a081, alpha);
      g.fillEllipse(x + dir * 85, y - 18, 23, 10);
    }
    if (f.stance) {
      const guardY =
        f.guardZone === "high"
          ? headY
          : f.guardZone === "middle"
            ? y - 65
            : y - 22;
      g.lineStyle(f.guard ? 4 : 1, c, f.guard ? 0.8 : 0.3);
      g.strokeEllipse(x + dir * 28, guardY, 55, 40);
    }
    if (f.active > 0 && f.move === "aggregates") {
      for (let i = 0; i < 5; i++) {
        g.lineStyle(2, c, 0.7);
        g.strokeEllipse(x + dir * (65 + i * 15), y - 40 - i * 23, 28, 11);
      }
    }
    if (f.active > 0 && f.move === "achievement") {
      g.lineStyle(2, c, 0.7);
      for (let i = 0; i < 4; i++)
        g.strokeRect(x + dir * 65 - 12, y - 8 - i * 30, 24, 28);
    }
    if (f.active > 0 && f.move === "rights") {
      g.lineStyle(3, c, 0.8);
      g.lineBetween(x + dir * 53, y - 128, x + dir * 53, y - 8);
    }
  }
}
function MOVEOFFENSE(f: Fighter) {
  return (
    f.move === "cause" ||
    f.move === "identity" ||
    f.move === "aggregates" ||
    f.move === "achievement"
  );
}
