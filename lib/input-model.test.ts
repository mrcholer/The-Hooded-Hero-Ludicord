import { strict as assert } from "node:assert";
import { test } from "node:test";
import { DEFAULT_BINDINGS, InputEdges, deadzoneAxis, emptyInput, gamepadInput, keyboardInput, mergeInput, normalizeBindings } from "./input-model";
import type { PadSnapshot } from "./input-model";
import { MenuRepeat } from "./menu-navigation";

function pad(buttons: number[] = [], axes = [0, 0]): PadSnapshot {
  return { id: "Test pad", index: 0, mapping: "standard", connected: true, axes, buttons: Array.from({ length: 18 }, (_, index) => ({ pressed: buttons.includes(index), value: Number(buttons.includes(index)) })) };
}
test("AZERTY, WASD and arrows share movement without Q firing the bow", () => {
  for (const key of ["q", "a", "arrowleft"]) { const state = keyboardInput(new Set([key])); assert.equal(state.left, 1); assert.equal(state.bow, 0); }
  for (const key of ["z", "w", "arrowup", " "]) assert.equal(keyboardInput(new Set([key])).jump, 1);
  for (const key of ["s", "arrowdown"]) assert.equal(keyboardInput(new Set([key])).down, 1);
  assert.equal(keyboardInput(new Set(["r"])).bow, 1);
});
test("standard Xbox/Sony button positions cover gameplay, menus and pause", () => {
  const state = gamepadInput(pad([0, 1, 2, 5, 8, 9, 14]), { ...DEFAULT_BINDINGS });
  for (const action of ["jump", "confirm", "bow", "sword", "sprint", "back", "pause", "left"] as const) assert.equal(state[action], 1);
  assert.equal(state.right, 0);
});
test("analog drift is filtered and stick magnitude scales smoothly", () => {
  assert.equal(deadzoneAxis(0.19, 0.2), 0); assert.equal(deadzoneAxis(-0.2, 0.2), 0);
  assert.ok(Math.abs(deadzoneAxis(-0.6, 0.2) + 0.5) < 1e-9);
  assert.equal(deadzoneAxis(2, 0.2), 1); assert.equal(deadzoneAxis(NaN, 0.2), 0);
  const state = gamepadInput(pad([], [-0.6, 0.8]), { ...DEFAULT_BINDINGS });
  assert.ok(Math.abs(state.left - 0.5) < 1e-9); assert.equal(state.right, 0); assert.ok(state.down > 0.7);
});
test("custom controller buttons, axes, inversion and disabled bindings", () => {
  const custom = { ...DEFAULT_BINDINGS, jump: 6, bow: -1, axisX: 2, invertX: true };
  const state = gamepadInput(pad([6, 1], [0, 0, 1]), custom);
  assert.equal(state.left, 1); assert.equal(state.jump, 1); assert.equal(state.bow, 0);
  assert.deepEqual(gamepadInput(pad([], []), { ...custom, axisX: -1 }), emptyInput());
});
test("disconnect and short button/axis arrays produce neutral input", () => {
  assert.deepEqual(gamepadInput(null, { ...DEFAULT_BINDINGS }), emptyInput());
  assert.deepEqual(gamepadInput({ ...pad([0, 14]), connected: false }, { ...DEFAULT_BINDINGS }), emptyInput());
  assert.deepEqual(gamepadInput({ ...pad(), buttons: [], axes: [] }, { ...DEFAULT_BINDINGS }), emptyInput());
});
test("keyboard and pad switching cannot repeat jump while either is held", () => {
  const edges = new InputEdges();
  assert.ok(edges.update(mergeInput(keyboardInput(new Set(["z"])), gamepadInput(pad(), { ...DEFAULT_BINDINGS }))).has("jump"));
  assert.ok(edges.consume("jump"));
  assert.equal(edges.update(mergeInput(keyboardInput(new Set()), gamepadInput(pad([0]), { ...DEFAULT_BINDINGS }))).has("jump"), false);
  assert.equal(edges.consume("jump"), false);
  edges.update(emptyInput());
  assert.ok(edges.update(gamepadInput(pad([0]), { ...DEFAULT_BINDINGS })).has("jump"));
});
test("short taps survive polling; reset drops queued actions and held movement", () => {
  const edges = new InputEdges();
  edges.update(keyboardInput(new Set(["z", "q"]))); edges.update(emptyInput());
  assert.equal(edges.consume("jump"), true); assert.equal(edges.consume("jump"), false);
  edges.update(keyboardInput(new Set(["e", "r", "d"]))); edges.reset();
  assert.equal(edges.consume("sword"), false); assert.equal(edges.consume("bow"), false); assert.deepEqual(edges.state, emptyInput());
});
test("corrupt stored mappings fall back or clamp to supported ranges", () => {
  assert.deepEqual(normalizeBindings(null), DEFAULT_BINDINGS);
  const result = normalizeBindings({ jump: 900, bow: -50, deadzone: 1, axisY: NaN, invertX: "true", invertY: true });
  assert.equal(result.jump, 31); assert.equal(result.bow, -1); assert.equal(result.deadzone, 0.5); assert.equal(result.axisY, 1); assert.equal(result.invertX, false); assert.equal(result.invertY, true);
});
test("held menu directions repeat at a bounded rate and reset after release", () => {
  const repeat = new MenuRepeat();
  const frame = (now: number, held = true) => ({ state: { ...emptyInput(), down: Number(held) }, pressed: new Set<never>(), now });
  assert.equal(repeat.read(frame(0)), "down"); assert.equal(repeat.read(frame(100)), null);
  assert.equal(repeat.read(frame(380)), "down"); assert.equal(repeat.read(frame(400)), null);
  assert.equal(repeat.read(frame(520)), "down"); assert.equal(repeat.read(frame(530, false)), null);
  assert.equal(repeat.read(frame(540)), "down");
});
