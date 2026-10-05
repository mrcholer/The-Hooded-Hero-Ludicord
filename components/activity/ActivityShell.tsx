import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWS } from "ludicord/ws/client";
import { useLudicordSession } from "ludicord/auth";
import type { HeroId, MovementBroadcast, PartySnapshot } from "@/game/shared/types";
import { adventureNetwork } from "@/lib/adventure-network";
import { PhaserGame } from "@/src/game/PhaserGame";
import type { IRefPhaserGame } from "@/src/game/PhaserGame";
import { gameInput } from "@/lib/game-input";
import { MenuRepeat, navigateDOM } from "@/lib/menu-navigation";
import { ControlGuide, ControllerIndicator, ControllerSettings } from "./GameControls";

const HEROES: readonly { id: HeroId; name: string; role: string }[] = [
  { id: "player-1", name: "The Ranger", role: "Balanced adventurer" },
  { id: "player-2", name: "The Rogue", role: "Quick and nimble" },
  { id: "player-3", name: "The Warden", role: "Steady and fearless" },
  { id: "player-4", name: "The Scout", role: "Fast trailblazer" },
];
const STATUS: Record<string, string> = { SELECTING: "Selecting", READY: "Ready", LOADING: "Loading", PLAYING: "Playing", FINISHED: "Finished", DISCONNECTED: "Reconnecting" };

type Screen = "menu" | "lobby" | "story" | "levels" | "settings" | "controls" | "credits";

export default function ActivityShell() {
  const connection = useWS("/ws/adventure");
  const session = useLudicordSession();
  const [snapshot, setSnapshot] = useState<PartySnapshot | null>(null);
  const [screen, setScreen] = useState<Screen>("menu");
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const gameRef = useRef<IRefPhaserGame | null>(null);
  useEffect(() => gameInput.start(), []);

  useEffect(() => connection.on("party:state", (value) => {
    if (!isSnapshot(value)) return;
    setSnapshot(value); adventureNetwork.setSnapshot(value);
    if (value.status === "finished" || value.status === "countdown") setScreen("lobby");
  }), [connection]);
  useEffect(() => connection.on("match:state", (value) => { if (isMovement(value)) adventureNetwork.receiveMovement(value); }), [connection]);
  useEffect(() => connection.on("party:error", (value) => { if (value && typeof value === "object" && typeof (value as { message?: unknown }).message === "string") setMessage((value as { message: string }).message); }), [connection]);
  useEffect(() => {
    adventureNetwork.setSender((event, data) => connection.emit(event, data));
    adventureNetwork.setRequester((event, data) => connection.emitWithAck(event, data, { timeout: 6_000 }));
    return () => { adventureNetwork.setSender(null); adventureNetwork.setRequester(null); };
  }, [connection]);
  useEffect(() => { adventureNetwork.setConnected(connection.status === "open"); if (connection.status === "open") connection.emit("party:sync"); return () => adventureNetwork.setConnected(false); }, [connection, connection.status]);

  const viewer = snapshot?.players.find((player) => player.id === snapshot.viewerId);
  useEffect(() => { if (viewer?.displayName) localStorage.setItem("hoodedHero.displayName", viewer.displayName); }, [viewer?.displayName]);
  const playing = snapshot?.status === "playing" && Boolean(viewer?.participating);
  const loadingMatch = snapshot?.status === "countdown" && Boolean(viewer?.participating);
  const waitingForMatch = snapshot && snapshot.status !== "lobby" && !viewer?.participating;
  const multiplayer = (playing || loadingMatch) && screen === "lobby";
  const showGame = screen === "story" || screen === "levels" || multiplayer;
  useLayoutEffect(() => {
    gameInput.setMode(!showGame || paused ? "menu" : gameReady && !loadingMatch && !gameError ? "game" : "blocked");
    gameInput.reset();
  }, [screen, showGame, paused, gameReady, loadingMatch, gameError]);
  useEffect(() => {
    if (!paused || multiplayer) return;
    const game = gameRef.current?.game;
    if (!game?.scene.isActive("PlayScene")) return;
    let destroyed = false;
    const onDestroyed = () => { destroyed = true; };
    game.events.once("destroy", onDestroyed);
    game.scene.pause("PlayScene");
    return () => {
      if (!destroyed && game.scene.isPaused("PlayScene")) game.scene.resume("PlayScene");
      game.events.off("destroy", onDestroyed);
    };
  }, [paused, multiplayer]);
  useEffect(() => {
    const repeat = new MenuRepeat();
    return gameInput.subscribe((frame) => {
      if (showGame && !paused) {
        if (gameReady && !loadingMatch && frame.pressed.has("pause") && (multiplayer || gameRef.current?.game?.scene.isActive("PlayScene"))) setPaused(true);
        return;
      }
      const root = document.querySelector<HTMLElement>(paused ? ".pause-overlay" : ".activity-shell");
      if (root) navigateDOM(frame, repeat, root, () => paused ? setPaused(false) : setScreen("menu"));
    });
  }, [showGame, paused, screen, gameReady, loadingMatch, multiplayer]);
  useEffect(() => { if (loadingMatch) { setProgress(0); setGameReady(false); setGameError(null); } }, [loadingMatch]);

  useEffect(() => {
    const openParty = () => setScreen("lobby");
    const openMenu = () => { setPaused(false); setScreen("menu"); };
    window.addEventListener("hoodedhero:party", openParty);
    window.addEventListener("hoodedhero:menu", openMenu);
    return () => { window.removeEventListener("hoodedhero:party", openParty); window.removeEventListener("hoodedhero:menu", openMenu); };
  }, []);

  async function act(event: string, data: Record<string, unknown> = {}) {
    if (!snapshot || connection.status !== "open" || pending) return;
    setPending(true); setMessage(null);
    try { await connection.emitWithAck(event, { revision: snapshot.revision, ...data }, { timeout: 6_000 }); }
    catch { setMessage((current) => current ?? "The party action failed. Please try again."); connection.emit("party:sync"); }
    finally { setPending(false); }
  }
  function startGame(next: "story" | "levels") { setPaused(false); setProgress(0); setGameReady(false); setGameError(null); setScreen(next); }
  async function exitGame() {
    setPaused(false);
    if (multiplayer) {
      try { await adventureNetwork.request("match:withdraw"); }
      catch { setMessage("You left the game. Reconnect to refresh your party state."); }
    }
    setScreen("menu");
  }

  if (showGame) return (
    <main className="game-view">
      <PhaserGame
        ref={gameRef}
        launch={multiplayer ? { mode: "multiplayer" } : screen === "levels" ? { mode: "level-select" } : { mode: "story", level: Number(localStorage.getItem("hoodedHero.level") ?? 1) }}
        onProgress={setProgress}
        onReady={() => { setGameReady(true); if (multiplayer) adventureNetwork.send("match:loaded"); }}
        onError={setGameError}
      />
      {!gameReady || gameError ? <LoadingOverlay progress={progress} connection={connection.status} error={gameError} /> : null}
      {gameReady && loadingMatch && snapshot ? <MatchCountdown startAt={snapshot.startAt} serverNow={snapshot.serverNow} /> : null}
      <div className="game-toolbar"><ControllerIndicator /><button type="button" disabled={!gameReady || loadingMatch} onClick={() => setPaused(true)}>Pause · Esc</button><button type="button" onClick={() => void exitGame()}>Exit</button></div>
      {paused ? <div className="pause-overlay"><section className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><p className="eyebrow">THE HOODED HERO</p><h1 id="pause-title">{multiplayer ? "Race menu" : "Adventure paused"}</h1><p>{multiplayer ? "The race keeps running for everyone. Your movement is stopped while this menu is open." : "Take a breath. Your adventure will wait."}</p><ControllerIndicator /><button className="start-button" autoFocus onClick={() => setPaused(false)}>Resume Adventure</button><button onClick={() => void exitGame()}>Return to Main Menu</button><small>Esc / P / Menu / Options to resume</small></section></div> : null}
    </main>
  );

  return (
    <main className="activity-shell">
      <div className="forest-layer forest-far" /><div className="forest-layer forest-near" /><div className="mist" />
      <header className="activity-header"><span className={`connection ${connection.status}`} /> <span>{!session ? "Solo preview · Open in Discord to play together" : connection.status === "open" ? "Party connected" : connection.status === "reconnecting" ? "Reconnecting..." : connection.status === "closed" || connection.status === "error" ? "Party connection lost" : "Connecting to party..."}</span>{connection.status === "error" || connection.status === "closed" ? <button onClick={() => connection.reconnect()}>Retry</button> : null}</header>
      {screen === "menu" ? <MainMenu onPlayTogether={() => setScreen("lobby")} onContinue={() => startGame("story")} onStory={() => { localStorage.setItem("hoodedHero.level", "1"); startGame("story"); }} onLevels={() => startGame("levels")} onSettings={() => setScreen("settings")} onControls={() => setScreen("controls")} onCredits={() => setScreen("credits")} /> : null}
      {screen === "lobby" ? <PartyLobby snapshot={snapshot} pending={pending} message={message ?? (!session ? "Launch this Activity in Discord to join your friends. Story Mode is available here." : connection.status === "closed" || connection.status === "error" ? "The party connection was lost. Use Retry to reconnect." : null)} waiting={Boolean(waitingForMatch)} onBack={() => setScreen("menu")} onHero={(hero) => void act("player:hero", { hero })} onReady={(ready) => void act(ready ? "player:ready" : "player:unready")} onStart={() => void act("match:start")} onRematch={() => void act("match:rematch")} onStory={() => startGame("story")} /> : null}
      {screen === "settings" ? <Settings onBack={() => setScreen("menu")} /> : null}
      {screen === "controls" ? <InfoPanel title="Controls" onBack={() => setScreen("menu")}><ControlGuide /></InfoPanel> : null}
      {screen === "credits" ? <InfoPanel title="Credits" onBack={() => setScreen("menu")}><p>Original game and pixel adventure by Tandid and contributors.</p><p>Ludicord Discord Activity migration preserves the original Phaser gameplay and MIT license.</p></InfoPanel> : null}
      <footer className="input-footer"><ControllerIndicator /><span>ZQSD / WASD / Arrows · Enter to select</span></footer>
    </main>
  );
}

function MainMenu(props: { onPlayTogether(): void; onContinue(): void; onStory(): void; onLevels(): void; onSettings(): void; onControls(): void; onCredits(): void }) {
  return <section className="menu-card"><img className="game-logo" src="/assets/logo2.png" alt="The Hooded Hero" /><p className="eyebrow">LUDICORD EDITION</p><div className="menu-actions"><button className="primary parchment" onClick={props.onPlayTogether}><span>Play Together</span><small>Adventure with your Discord party</small></button><button className="parchment" onClick={props.onContinue}>Continue Adventure</button><button className="parchment" onClick={props.onStory}>Story Mode</button><button className="parchment" onClick={props.onLevels}>Level Select</button></div><nav><button onClick={props.onControls}>Controls</button><button onClick={props.onSettings}>Settings</button><button onClick={props.onCredits}>Credits</button></nav></section>;
}

function PartyLobby({ snapshot, pending, message, waiting, onBack, onHero, onReady, onStart, onRematch, onStory }: { snapshot: PartySnapshot | null; pending: boolean; message: string | null; waiting: boolean; onBack(): void; onHero(hero: HeroId): void; onReady(ready: boolean): void; onStart(): void; onRematch(): void; onStory(): void }) {
  const viewer = snapshot?.players.find((player) => player.id === snapshot.viewerId);
  const participants = snapshot?.players.filter((player) => player.participating && player.connected) ?? [];
  const canStart = Boolean(snapshot && viewer?.id === snapshot.leaderId && participants.length >= 2 && participants.every((player) => player.ready && player.hero));
  if (snapshot?.status === "finished") return <Results snapshot={snapshot} pending={pending} onRematch={onRematch} onBack={onBack} onStory={onStory} />;
  return <section className="party-card"><div className="panel-heading"><button className="back-button" onClick={onBack}>← Back</button><div><p className="eyebrow">DISCORD ACTIVITY PARTY</p><h1>Adventure Party</h1><p>{participants.length} / 4 heroes assembled</p></div><span className="leader-chip">{viewer?.id === snapshot?.leaderId ? "Party Leader" : "Party Member"}</span></div>
    {waiting ? <div className="waiting-match"><strong>Game in progress</strong><span>You will join when the party returns to the lobby.</span></div> : null}
    <div className="player-list">{snapshot ? snapshot.players.map((player) => <article className={`party-player ${player.id === snapshot.leaderId ? "leader" : ""}`} key={player.id}>{player.avatar ? <img src={player.avatar} alt="" /> : <span className="avatar-fallback">{player.displayName[0]}</span>}<div><strong>{player.displayName}{player.id === snapshot.viewerId ? " · You" : ""}</strong><small>{player.hero ? HEROES.find((hero) => hero.id === player.hero)?.name : "Choosing a hero"}</small></div><span className={`player-status status-${player.status.toLowerCase()}`}>{STATUS[player.status]}</span></article>) : <div className="party-loading">Connecting to your Discord party...</div>}</div>
    {!waiting && snapshot?.status === "lobby" ? <><div className="hero-grid">{HEROES.map((hero) => <button key={hero.id} className={`hero-option ${viewer?.hero === hero.id ? "selected" : ""}`} onClick={() => onHero(hero.id)} disabled={pending}><span className={`hero-sprite ${hero.id}`} /><strong>{hero.name}</strong><small>{hero.role}</small><small>{snapshot.players.filter((player) => player.hero === hero.id).map((player) => player.displayName).join(" · ") || "Available"}</small>{viewer?.hero === hero.id ? <i>Selected</i> : null}</button>)}</div><div className="lobby-actions"><button className="ready-button" onClick={() => onReady(!viewer?.ready)} disabled={!viewer?.hero || pending}>{viewer?.ready ? "Not Ready" : "Ready"}</button>{viewer?.id === snapshot.leaderId ? <button className="start-button" onClick={onStart} disabled={!canStart || pending}>Start Adventure</button> : <span>Waiting for the party leader</span>}</div></> : null}
    {message ? <div className="error-banner" role="alert">{message}</div> : null}
  </section>;
}

function Results({ snapshot, pending, onRematch, onBack, onStory }: { snapshot: PartySnapshot; pending: boolean; onRematch(): void; onBack(): void; onStory(): void }) {
  return <section className="results-card"><p className="eyebrow">RACE COMPLETE</p><h1>Adventure Complete</h1><div className="podium">{snapshot.finishOrder.map((result) => { const player = snapshot.players.find((entry) => entry.id === result.playerId); return <article key={result.playerId}><span>#{result.place}</span>{player?.avatar ? <img src={player.avatar} alt="" /> : <i>{player?.displayName[0]}</i>}<strong>{player?.displayName}</strong><time>{formatTime(result.finishTime)}</time></article>; })}</div><div className="result-actions">{snapshot.viewerId === snapshot.leaderId ? <button className="start-button" disabled={pending} onClick={onRematch}>Play Again</button> : <span>Waiting for the party leader</span>}{snapshot.viewerId === snapshot.leaderId ? <button disabled={pending} onClick={onRematch}>Change Hero</button> : null}<button onClick={onStory}>Story Mode</button><button onClick={onBack}>Main Menu</button></div></section>;
}

function Settings({ onBack }: { onBack(): void }) {
  const initial = useMemo(() => ({ music: Number(localStorage.getItem("hoodedHero.music") ?? 40), sfx: Number(localStorage.getItem("hoodedHero.sfx") ?? 65), muted: localStorage.getItem("hoodedHero.muted") === "true" }), []);
  const [value, setValue] = useState(initial);
  function save() { localStorage.setItem("hoodedHero.music", String(value.music)); localStorage.setItem("hoodedHero.sfx", String(value.sfx)); localStorage.setItem("hoodedHero.muted", String(value.muted)); window.dispatchEvent(new CustomEvent("hoodedhero:audio", { detail: value })); onBack(); }
  return <InfoPanel title="Settings" onBack={onBack}><label className="slider-row"><span>Music volume</span><input type="range" min="0" max="100" value={value.music} onChange={(event) => setValue({ ...value, music: Number(event.target.value) })} /><output>{value.music}%</output></label><label className="slider-row"><span>Sound effects</span><input type="range" min="0" max="100" value={value.sfx} onChange={(event) => setValue({ ...value, sfx: Number(event.target.value) })} /><output>{value.sfx}%</output></label><label className="mute-row"><input type="checkbox" checked={value.muted} onChange={(event) => setValue({ ...value, muted: event.target.checked })} /><span>Mute all audio</span></label><button className="start-button" onClick={save}>Save Audio Settings</button><ControllerSettings /></InfoPanel>;
}
function InfoPanel({ title, onBack, children }: { title: string; onBack(): void; children: React.ReactNode }) { return <section className="info-card"><button className="back-button" onClick={onBack}>← Back</button><img src="/assets/logo2.png" alt="" /><h1>{title}</h1><div className="info-content">{children}</div></section>; }
function LoadingOverlay({ progress, connection, error }: { progress: number; connection: string; error: string | null }) { const pct = Math.round(progress * 100); return <div className="loading-overlay"><img src="/assets/logo2.png" alt="The Hooded Hero" /><h1>{error ? "Adventure unavailable" : "Loading Adventure..."}</h1>{error ? <p role="alert">{error}</p> : <><div className="loading-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Loading game assets"><i style={{ width: `${pct}%` }} /></div><strong>{pct}%</strong><span>{connection === "open" ? "Party connected · Loading world..." : "Loading world..."}</span></>}</div>; }
function MatchCountdown({ startAt, serverNow }: { startAt: number | null; serverNow: number }) {
  const anchor = useMemo(() => ({ serverNow, receivedAt: performance.now() }), [serverNow]);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { setElapsed(0); const timer = window.setInterval(() => setElapsed(performance.now() - anchor.receivedAt), 100); return () => clearInterval(timer); }, [anchor]);
  const now = anchor.serverNow + elapsed;
  return <div className="countdown"><span>{startAt ? "Adventure begins in" : "Waiting for every hero to load"}</span><strong>{startAt ? Math.max(0, Math.ceil((startAt - now) / 1000)) || "GO!" : "…"}</strong></div>;
}
function formatTime(ms: number) { const minutes = Math.floor(ms / 60_000); const seconds = Math.floor((ms % 60_000) / 1000); const millis = ms % 1000; return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}.${String(millis).padStart(3,"0")}`; }
function isSnapshot(value: unknown): value is PartySnapshot { return typeof value === "object" && value !== null && typeof (value as PartySnapshot).serverNow === "number" && typeof (value as PartySnapshot).revision === "number" && Array.isArray((value as PartySnapshot).players); }
function isMovement(value: unknown): value is MovementBroadcast { return typeof value === "object" && value !== null && typeof (value as MovementBroadcast).playerId === "string" && typeof (value as MovementBroadcast).sequence === "number"; }
