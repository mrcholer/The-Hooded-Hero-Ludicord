import { strict as assert } from "node:assert";
import { test } from "node:test";
import { GameInput } from "./game-input";
import type { PadSnapshot } from "./input-model";

function environment(run: (env: {
  input: GameInput; step(): void; key(type: "keydown" | "keyup", key: string): void;
  pads(value: PadSnapshot[]): void; focus(value: boolean): void; denyController(): void; stop(): void;
}) => void) {
  const names = ["window", "document", "navigator", "HTMLElement", "localStorage", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false, hasFocus: () => true });
  let available: PadSnapshot[] = [], denied = false, now = 0, sequence = 0;
  const rafs = new Map<number, FrameRequestCallback>(), storage = new Map<string, string>();
  const mocks: Record<string, unknown> = {
    window: win, document: doc, HTMLElement: class {},
    navigator: { getGamepads: () => { if (denied) throw new Error("Blocked by frame"); return available; } },
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    requestAnimationFrame: (callback: FrameRequestCallback) => { rafs.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: (id: number) => rafs.delete(id),
  };
  for (const name of names) Object.defineProperty(globalThis, name, { value: mocks[name], configurable: true, writable: true });
  const input = new GameInput(); const stop = input.start(); input.setMode("game");
  try {
    run({ input, step: () => { const frame = rafs.entries().next().value; assert.ok(frame); rafs.delete(frame[0]); frame[1](now += 16); },
      key: (type, key) => { win.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { key, repeat: false })); },
      pads: (value) => { available = value; }, focus: (value) => win.dispatchEvent(new Event(value ? "focus" : "blur")),
      denyController: () => { denied = true; }, stop,
    });
  } finally {
    // stop() can be called by the test to exercise cleanup; avoid a second release.
    if (rafs.size) stop();
    names.forEach((name, index) => { const original = originals[index]; if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
  }
}
const device = (buttons: number[] = [], index = 0): PadSnapshot => ({ id: `Controller ${index}`, index, mapping: "standard", connected: true, axes: [0, 0], buttons: Array.from({ length: 18 }, (_, i) => ({ pressed: buttons.includes(i), value: Number(buttons.includes(i)) })) });

test("keyboard input keeps working across frames without a connected controller", () => environment(({ input, key, step }) => {
  key("keydown", "q"); step(); assert.equal(input.gameplay().horizontal, -1);
  step(); assert.equal(input.gameplay().horizontal, -1);
  key("keyup", "q"); step(); assert.equal(input.gameplay().horizontal, 0);
}));
test("fast keyboard taps are consumed by gameplay and delivered to menu listeners", () => environment(({ input, key, step }) => {
  const frames: string[] = []; input.subscribe((frame) => frames.push(...frame.pressed));
  key("keydown", "z"); key("keyup", "z"); step();
  assert.equal(input.gameplay().jump, true); assert.equal(input.gameplay().jump, false); assert.ok(frames.includes("jump"));
}));
test("blur clears movement and focus requires a held controller button to be released", () => environment(({ input, pads, step, key, focus }) => {
  pads([device()]); step(); pads([device([0, 15])]); step();
  assert.equal(input.gameplay().jump, true); assert.equal(input.gameplay().horizontal, 1);
  key("keydown", "q"); focus(false); step(); assert.equal(input.gameplay().horizontal, 0);
  focus(true); step(); assert.equal(input.gameplay().jump, false); assert.equal(input.gameplay().horizontal, 0);
  pads([device()]); step(); pads([device([0])]); step(); assert.equal(input.gameplay().jump, true);
}));
test("unplugging a controller stops its movement without repeating a held keyboard jump", () => environment(({ input, pads, step, key }) => {
  pads([device()]); step(); pads([device([15])]); step(); assert.equal(input.gameplay().horizontal, 1);
  key("keydown", "z"); assert.equal(input.gameplay().jump, true);
  pads([]); step(); assert.equal(input.gameplay().horizontal, 0); assert.equal(input.gameplay().jump, false); assert.equal(input.status.id, null);
}));
test("frame permission denial reports a usable error and leaves keyboard gameplay available", () => environment(({ input, denyController, step, key }) => {
  denyController(); key("keydown", "d"); step(); assert.match(input.status.error!, /blocked/); assert.equal(input.gameplay().horizontal, 1);
}));
test("button remapping captures a release/press without activating gameplay", () => environment(({ input, pads, step }) => {
  pads([device()]); step(); let captured = -1;
  input.captureButton((index) => { captured = index; }); step(); pads([device([6])]); step();
  assert.equal(captured, 6); assert.equal(input.gameplay().jump, false);
  input.saveBindings({ ...input.bindings, jump: captured }); pads([device()]); step(); pads([device([6])]); step();
  assert.equal(input.gameplay().jump, true);
}));
test("pause mode suppresses gameplay and shutdown removes keyboard listeners", () => environment(({ input, step, key, stop }) => {
  input.setMode("menu"); key("keydown", "z"); key("keydown", "d"); step();
  assert.equal(input.gameplay().jump, false); assert.equal(input.gameplay().horizontal, 0);
  input.setMode("game"); step(); assert.equal(input.gameplay().jump, false);
  stop(); key("keydown", "d"); assert.equal(input.gameplay().horizontal, 0);
}));
