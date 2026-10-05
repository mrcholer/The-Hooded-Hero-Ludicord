import { ACTIONS, DEFAULT_BINDINGS, InputEdges, emptyInput, gamepadInput, keyboardInput, mergeInput, normalizeBindings } from "./input-model";
import type { Action, ControllerBindings, InputState, PadSnapshot } from "./input-model";

export type ControllerStatus = { id: string | null; mapping: string; index: number | null; error: string | null };
export type InputFrame = { state: InputState; pressed: ReadonlySet<Action>; now: number };
const INPUT_KEYS = new Set(["a", "q", "d", "w", "z", "s", " ", "shift", "r", "e", "p", "escape", "enter", "arrowleft", "arrowright", "arrowup", "arrowdown"]);
const editable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("input,select,textarea,[contenteditable=true]"));

export class GameInput {
  readonly edges = new InputEdges();
  bindings: ControllerBindings = { ...DEFAULT_BINDINGS };
  status: ControllerStatus = { id: null, mapping: "", index: null, error: null };
  private keys = new Set<string>();
  private frames = new Set<(frame: InputFrame) => void>();
  private statuses = new Set<(status: ControllerStatus) => void>();
  private mode: "menu" | "game" | "blocked" = "menu";
  private focused = true;
  private requireNeutralPad = true;
  private raf = 0;
  private owners = 0;
  private capture: ((index: number) => void) | null = null;
  private previousButtons: boolean[] = [];
  private controllerState = emptyInput();
  private keyboardPressed = new Set<Action>();

  start(): () => void {
    if (++this.owners === 1) {
      try { this.bindings = normalizeBindings(JSON.parse(localStorage.getItem("hoodedHero.controller") ?? "null")); } catch { this.bindings = { ...DEFAULT_BINDINGS }; }
      this.focused = document.hasFocus() && !document.hidden;
      window.addEventListener("keydown", this.keyDown, { capture: true });
      window.addEventListener("keyup", this.keyUp, { capture: true });
      window.addEventListener("blur", this.blur);
      window.addEventListener("focus", this.focus);
      document.addEventListener("visibilitychange", this.visibility);
      this.raf = requestAnimationFrame(this.tick);
    }
    return () => {
      if (--this.owners !== 0) return;
      cancelAnimationFrame(this.raf);
      window.removeEventListener("keydown", this.keyDown, { capture: true });
      window.removeEventListener("keyup", this.keyUp, { capture: true });
      window.removeEventListener("blur", this.blur);
      window.removeEventListener("focus", this.focus);
      document.removeEventListener("visibilitychange", this.visibility);
      this.reset(); this.capture = null;
    };
  }
  setMode(mode: "menu" | "game" | "blocked") { if (mode !== this.mode) { this.mode = mode; this.reset(); } }
  reset() { this.keys.clear(); this.edges.reset(); this.keyboardPressed.clear(); this.controllerState = emptyInput(); this.requireNeutralPad = true; }
  subscribe(listener: (frame: InputFrame) => void) { this.frames.add(listener); return () => { this.frames.delete(listener); }; }
  subscribeStatus(listener: (status: ControllerStatus) => void) { this.statuses.add(listener); listener(this.status); return () => { this.statuses.delete(listener); }; }
  saveBindings(value: ControllerBindings) {
    this.bindings = normalizeBindings(value);
    localStorage.setItem("hoodedHero.controller", JSON.stringify(this.bindings));
    this.reset();
  }
  captureButton(listener: (index: number) => void) {
    this.capture = listener; this.reset();
    return () => { if (this.capture === listener) this.capture = null; this.reset(); };
  }
  gameplay() {
    const enabled = this.mode === "game" && this.focused;
    const state = enabled ? this.edges.state : emptyInput();
    return { horizontal: state.right - state.left, sprint: state.sprint > 0.5, jump: this.edges.consume("jump") && enabled, bow: this.edges.consume("bow") && enabled, sword: this.edges.consume("sword") && enabled };
  }
  private keyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (!this.focused || event.ctrlKey || event.metaKey || event.altKey || editable(event.target) || !INPUT_KEYS.has(key)) return;
    if (this.mode === "game" && (key === "enter" || key === " ") && event.target instanceof HTMLElement && event.target.closest(".game-toolbar button")) return;
    if (event.repeat && !this.keys.has(key)) return;
    this.keys.add(key);
    if (this.mode !== "blocked" && !this.capture) {
      const pressed = this.edges.update(mergeInput(keyboardInput(this.keys), this.controllerState));
      pressed.forEach((action) => this.keyboardPressed.add(action));
    }
    if (this.mode === "game" || key.startsWith("arrow") || key === " " || key === "enter") event.preventDefault();
  };
  private keyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
    if (this.focused && this.mode !== "blocked" && !this.capture) this.edges.update(mergeInput(keyboardInput(this.keys), this.controllerState));
  };
  private blur = () => { this.focused = false; this.reset(); };
  private focus = () => { this.focused = !document.hidden; this.reset(); };
  private visibility = () => { this.focused = !document.hidden && document.hasFocus(); this.reset(); };
  private report(status: ControllerStatus) {
    if (JSON.stringify(status) === JSON.stringify(this.status)) return;
    this.status = status;
    this.statuses.forEach((listener) => listener(status));
  }
  private poll(): PadSnapshot | null {
    try {
      if (!navigator.getGamepads) { this.report({ id: null, mapping: "", index: null, error: "This browser does not support controllers." }); return null; }
      const pads = [...navigator.getGamepads()].filter((pad): pad is Gamepad => Boolean(pad?.connected));
      const active = pads.find((pad) => pad.buttons.some((button) => button.pressed) || pad.axes.some((axis) => Math.abs(axis) > 0.5));
      const pad = active ?? pads.find((pad) => pad.index === this.status.index) ?? pads[0] ?? null;
      if ((pad?.index ?? null) !== this.status.index || (pad?.id ?? null) !== this.status.id) { this.requireNeutralPad = true; this.previousButtons = []; this.controllerState = emptyInput(); }
      this.report({ id: pad?.id ?? null, mapping: pad?.mapping ?? "", index: pad?.index ?? null, error: null });
      return pad;
    } catch {
      this.report({ id: null, mapping: "", index: null, error: "Controller access is blocked by this browser or Discord frame. Keyboard controls still work." });
      return null;
    }
  }
  private tick = (now: number) => {
    const pad = this.poll();
    let controller = gamepadInput(pad, this.bindings);
    const buttons = pad?.buttons.map((button) => button.pressed || button.value > 0.5) ?? [];
    if (this.capture) {
      const index = buttons.findIndex((pressed, i) => pressed && !this.previousButtons[i]);
      if (index >= 0 && !this.requireNeutralPad) { const callback = this.capture; this.capture = null; callback(index); this.reset(); }
    }
    this.previousButtons = buttons;
    if (this.requireNeutralPad) {
      if (!buttons.some(Boolean) && ACTIONS.every((action) => controller[action] === 0)) this.requireNeutralPad = false;
      controller = emptyInput();
    }
    this.controllerState = controller;
    const state = this.focused && this.mode !== "blocked" && !this.capture ? mergeInput(keyboardInput(this.keys), controller) : emptyInput();
    const pressed = new Set([...this.edges.update(state), ...this.keyboardPressed]);
    this.keyboardPressed.clear();
    this.frames.forEach((listener) => listener({ state, pressed, now }));
    this.raf = requestAnimationFrame(this.tick);
  };
}
export const gameInput = new GameInput();
