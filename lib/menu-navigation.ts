import type { InputFrame } from "./game-input";

export class MenuRepeat {
  private direction = "";
  private nextAt = 0;
  read({ state, now }: InputFrame): "left" | "right" | "up" | "down" | null {
    const direction = (["up", "down", "left", "right"] as const).find((key) => state[key] > 0.5) ?? "";
    if (!direction) { this.direction = ""; return null; }
    if (direction !== this.direction) { this.direction = direction; this.nextAt = now + 380; return direction; }
    if (now < this.nextAt) return null;
    this.nextAt = now + 140;
    return direction;
  }
}
export function navigateDOM(frame: InputFrame, repeat: MenuRepeat, root: HTMLElement, back: () => void) {
  if (frame.pressed.has("back") || frame.pressed.has("pause")) { back(); return; }
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("button:not(:disabled),summary")].filter((button) => button.getClientRects().length && !button.closest("[hidden]"));
  if (!buttons.length) return;
  const active = document.activeElement as HTMLElement | null;
  const direction = repeat.read(frame);
  if (direction) {
    const origin = active && buttons.includes(active as HTMLButtonElement) ? active.getBoundingClientRect() : null;
    let target = buttons[0];
    if (origin) {
      const horizontal = direction === "left" || direction === "right";
      const sign = direction === "left" || direction === "up" ? -1 : 1;
      const x = origin.x + origin.width / 2, y = origin.y + origin.height / 2;
      const candidates = buttons.filter((button) => button !== active).map((button) => {
        const box = button.getBoundingClientRect();
        const dx = box.x + box.width / 2 - x, dy = box.y + box.height / 2 - y;
        return { button, forward: (horizontal ? dx : dy) * sign, sideways: Math.abs(horizontal ? dy : dx) };
      }).filter((entry) => entry.forward > 4).sort((a, b) => a.forward + a.sideways * 3 - b.forward - b.sideways * 3);
      target = candidates[0]?.button ?? active as HTMLButtonElement;
    }
    target.focus(); target.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  if (frame.pressed.has("confirm")) {
    const selected = buttons.find((button) => button === document.activeElement);
    if (selected) selected.click(); else buttons[0].focus();
  }
}
