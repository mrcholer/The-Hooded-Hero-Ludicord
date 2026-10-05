import { useEffect, useState } from "react";
import { gameInput } from "@/lib/game-input";
import type { ControllerStatus } from "@/lib/game-input";
import { DEFAULT_BINDINGS } from "@/lib/input-model";
import type { ControllerBindings } from "@/lib/input-model";

export function useControllerStatus() {
  const [status, setStatus] = useState<ControllerStatus>(gameInput.status);
  useEffect(() => gameInput.subscribeStatus(setStatus), []);
  return status;
}
export function ControllerIndicator() {
  const status = useControllerStatus();
  return <span className="controller-indicator" title={status.error ?? status.id ?? "Connect a controller and press a button"}>🎮 {status.error ? "Keyboard mode" : status.id ? "Controller connected" : "Keyboard / Controller"}</span>;
}
export function ControlGuide() {
  return <>
    <p className="controls-intro">WASD, ZQSD and arrow keys work together. Connect an Xbox, DualShock 4, DualSense or another browser-compatible controller, then press a button.</p>
    <div className="controls-table" role="table" aria-label="Keyboard and controller controls">
      <div className="controls-table-header" role="row"><strong role="columnheader">Action</strong><strong role="columnheader">Keyboard</strong><strong role="columnheader">Xbox / PlayStation</strong></div>
      {[
        ["Move", "Q / A / ← · D / →", "Left stick / D-pad"],
        ["Jump / double jump", "Z / W / ↑ / Space", "A / Cross ✕"],
        ["Sprint (hold)", "Shift", "RB / R1"],
        ["Bow · Story Mode", "R", "B / Circle ○"],
        ["Sword · Story Mode", "E", "X / Square □"],
        ["Pause / resume", "Esc / P", "Menu / Options"],
        ["Navigate menus", "ZQSD / WASD / arrows", "Left stick / D-pad"],
        ["Select / go back", "Enter / Space · Esc", "A / Cross · View / Share"],
      ].map(([action, keyboard, controller]) => <div role="row" key={action}><span role="cell">{action}</span><kbd role="cell">{keyboard}</kbd><span role="cell">{controller}</span></div>)}
    </div>
    <p className="controls-note">S / ↓ moves down in menus. The platformer has no crouch action. Q now moves left; the bow uses R to avoid the AZERTY conflict. Controller buttons can be remapped in Settings.</p>
    <p className="controls-note">USB and Bluetooth use the same controls. If a Discord frame blocks controller access, use the keyboard or test in a supported browser.</p>
  </>;
}

type ButtonBinding = Exclude<keyof ControllerBindings, "axisX" | "axisY" | "invertX" | "invertY" | "deadzone">;
const BUTTONS: readonly [ButtonBinding, string][] = [["jump", "Jump / select"], ["sprint", "Sprint"], ["bow", "Bow"], ["sword", "Sword"], ["pause", "Pause / resume"], ["back", "Back"], ["dpadLeft", "D-pad left"], ["dpadRight", "D-pad right"], ["dpadUp", "D-pad up"], ["dpadDown", "D-pad down"]];

export function ControllerSettings() {
  const status = useControllerStatus();
  const [bindings, setBindings] = useState<ControllerBindings>(() => ({ ...gameInput.bindings }));
  const [recording, setRecording] = useState<ButtonBinding | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!recording) return;
    const cancel = gameInput.captureButton((index) => {
      setBindings((value) => ({ ...value, [recording]: index }));
      setRecording(null); setNotice("Button recorded. Save controller settings to apply it.");
    });
    const timer = window.setTimeout(() => { setRecording(null); setNotice("No button received. Reconnect the controller and try again."); }, 15_000);
    return () => { cancel(); clearTimeout(timer); };
  }, [recording]);
  function save() { gameInput.saveBindings(bindings); setNotice("Controller settings saved on this browser."); }
  return <section className="controller-settings" aria-labelledby="controller-title">
    <h2 id="controller-title">Controller</h2>
    <div className="controller-device" role="status"><strong>{status.error ? "Controller unavailable" : status.id ? "Connected" : "Waiting for a controller"}</strong><span>{status.error ?? status.id ?? "Connect by USB or Bluetooth, release the controls, then press a button."}</span>{status.id ? <small>{status.mapping === "standard" ? "Standard layout · Xbox / PlayStation controls" : "Custom layout · Remap the buttons below"}</small> : null}</div>
    <div className="controller-tuning">
      <div><span>Stick deadzone</span><button aria-label="Decrease stick deadzone" onClick={() => setBindings({ ...bindings, deadzone: Math.max(0.05, bindings.deadzone - 0.05) })}>−</button><output>{Math.round(bindings.deadzone * 100)}%</output><button aria-label="Increase stick deadzone" onClick={() => setBindings({ ...bindings, deadzone: Math.min(0.5, bindings.deadzone + 0.05) })}>+</button></div>
      {(["axisX", "axisY"] as const).map((axis) => <div key={axis}><span>{axis === "axisX" ? "Horizontal axis" : "Menu vertical axis"}</span><button onClick={() => setBindings({ ...bindings, [axis]: bindings[axis] >= 7 ? -1 : bindings[axis] + 1 })}>{bindings[axis] < 0 ? "Disabled" : `Axis ${bindings[axis]}`}</button><button aria-pressed={bindings[axis === "axisX" ? "invertX" : "invertY"]} onClick={() => { const key = axis === "axisX" ? "invertX" : "invertY"; setBindings({ ...bindings, [key]: !bindings[key] }); }}>Invert</button></div>)}
    </div>
    <details className="binding-details"><summary>Remap buttons</summary><p>Choose an action, release all controller buttons, then press the button you want to use. Button numbers start at zero.</p><div className="binding-grid">{BUTTONS.map(([key, label]) => <div key={key}><span>{label}</span><button aria-label={`Remap ${label}`} disabled={!status.id || Boolean(recording)} onClick={() => { setRecording(key); setNotice(""); }}>{bindings[key] < 0 ? "Disabled" : `Button ${bindings[key]}`}</button><button aria-label={`Disable ${label}`} disabled={Boolean(recording)} onClick={() => setBindings({ ...bindings, [key]: -1 })}>×</button></div>)}</div></details>
    {recording ? <div className="recording-binding" role="status"><span>Release the controls, then press a button for {BUTTONS.find(([key]) => key === recording)?.[1]}…</span><button onClick={() => setRecording(null)}>Cancel</button></div> : null}
    <div className="controller-actions"><button className="start-button" disabled={Boolean(recording)} onClick={save}>Save Controller</button><button disabled={Boolean(recording)} onClick={() => { setBindings({ ...DEFAULT_BINDINGS }); setNotice("Default layout restored. Save to apply it."); }}>Reset to Default</button></div>
    {notice ? <p className="controls-note" role="status">{notice}</p> : null}
  </section>;
}
