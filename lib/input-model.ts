export type Action = "left" | "right" | "up" | "down" | "jump" | "sprint" | "bow" | "sword" | "confirm" | "back" | "pause";
export type InputState = Record<Action, number>;
export const ACTIONS: readonly Action[] = ["left", "right", "up", "down", "jump", "sprint", "bow", "sword", "confirm", "back", "pause"];
export const emptyInput = (): InputState => Object.fromEntries(ACTIONS.map((action) => [action, 0])) as InputState;
export interface ControllerBindings {
  axisX: number; axisY: number; invertX: boolean; invertY: boolean; deadzone: number;
  jump: number; sword: number; bow: number; sprint: number; pause: number; back: number;
  dpadLeft: number; dpadRight: number; dpadUp: number; dpadDown: number;
}
export const DEFAULT_BINDINGS: Readonly<ControllerBindings> = {
  axisX: 0, axisY: 1, invertX: false, invertY: false, deadzone: 0.2,
  jump: 0, sword: 2, bow: 1, sprint: 5, pause: 9, back: 8,
  dpadLeft: 14, dpadRight: 15, dpadUp: 12, dpadDown: 13,
};
export interface PadSnapshot {
  readonly index: number; readonly id: string; readonly connected: boolean; readonly mapping: string;
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
}
export function normalizeBindings(value: unknown): ControllerBindings {
  const result = { ...DEFAULT_BINDINGS };
  if (!value || typeof value !== "object") return result;
  for (const key of Object.keys(result) as (keyof ControllerBindings)[]) {
    const item = (value as Record<string, unknown>)[key];
    if (key === "invertX" || key === "invertY") result[key] = item === true;
    else if (typeof item === "number" && Number.isFinite(item)) {
      result[key] = key === "deadzone" ? Math.min(0.5, Math.max(0.05, item)) : Math.min(31, Math.max(-1, Math.floor(item)));
    }
  }
  return result;
}
export function keyboardInput(keys: ReadonlySet<string>): InputState {
  const held = (...choices: string[]) => Number(choices.some((key) => keys.has(key)));
  return {
    left: held("a", "q", "arrowleft"), right: held("d", "arrowright"),
    up: held("w", "z", "arrowup"), down: held("s", "arrowdown"),
    jump: held(" ", "w", "z", "arrowup"), sprint: held("shift"),
    bow: held("r"), sword: held("e"), confirm: held("enter", " "),
    back: held("escape"), pause: held("escape", "p"),
  };
}
export function deadzoneAxis(value: number, deadzone: number): number {
  if (!Number.isFinite(value) || Math.abs(value) <= deadzone) return 0;
  return Math.sign(value) * Math.min(1, (Math.abs(value) - deadzone) / (1 - deadzone));
}
export function gamepadInput(pad: PadSnapshot | null, bindings: ControllerBindings): InputState {
  if (!pad?.connected) return emptyInput();
  const button = (index: number) => Number(Boolean(pad.buttons[index]?.pressed || pad.buttons[index]?.value > 0.5));
  const x = deadzoneAxis((pad.axes[bindings.axisX] ?? 0) * (bindings.invertX ? -1 : 1), bindings.deadzone);
  const y = deadzoneAxis((pad.axes[bindings.axisY] ?? 0) * (bindings.invertY ? -1 : 1), bindings.deadzone);
  return {
    left: Math.max(-x, button(bindings.dpadLeft), 0), right: Math.max(x, button(bindings.dpadRight), 0),
    up: Math.max(-y, button(bindings.dpadUp), 0), down: Math.max(y, button(bindings.dpadDown), 0),
    jump: button(bindings.jump), confirm: button(bindings.jump), sword: button(bindings.sword),
    bow: button(bindings.bow), sprint: button(bindings.sprint), pause: button(bindings.pause), back: button(bindings.back),
  };
}
export function mergeInput(keyboard: InputState, controller: InputState): InputState {
  return Object.fromEntries(ACTIONS.map((action) => [action, Math.max(keyboard[action], controller[action])])) as InputState;
}
// Edges stay queued until gameplay consumes them, even when render and physics rates differ.
export class InputEdges {
  state = emptyInput();
  private pending = new Set<Action>();
  update(next: InputState): ReadonlySet<Action> {
    const pressed = new Set<Action>();
    for (const action of ACTIONS) if (next[action] > 0.5 && this.state[action] <= 0.5) { pressed.add(action); this.pending.add(action); }
    this.state = next;
    return pressed;
  }
  consume(action: Action): boolean { const pressed = this.pending.has(action); this.pending.delete(action); return pressed; }
  reset(): void { this.state = emptyInput(); this.pending.clear(); }
}
