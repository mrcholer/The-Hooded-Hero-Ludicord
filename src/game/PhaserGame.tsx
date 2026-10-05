import type * as Phaser from "phaser";
import { forwardRef, useLayoutEffect, useRef } from "react";
import type { GameLaunch } from "@/lib/adventure-network";
import StartGame from "./main";
import { attachControllerNavigation } from "./controller-navigation";

export interface IRefPhaserGame { game: Phaser.Game | null; scene: Phaser.Scene | null; }
interface Props { readonly launch: GameLaunch; readonly onProgress?: (progress: number) => void; readonly onReady?: () => void; readonly onError?: (message: string) => void; }

export const PhaserGame = forwardRef<IRefPhaserGame, Props>(function PhaserGame({ launch, onProgress, onReady, onError }, ref) {
  const game = useRef<Phaser.Game | null>(null);
  const callbacks = useRef({ onProgress, onReady, onError });
  useLayoutEffect(() => { callbacks.current = { onProgress, onReady, onError }; }, [onProgress, onReady, onError]);
  const mode = launch.mode;
  const level = launch.mode === "story" ? launch.level : 1;
  useLayoutEffect(() => {
    const progress = (value: number) => callbacks.current.onProgress?.(value);
    const ready = () => { callbacks.current.onReady?.(); document.getElementById("game-container")?.focus(); };
    const assetError = (key: string) => callbacks.current.onError?.(`Could not load ${key}. Check your connection and try again.`);
    const nextLaunch: GameLaunch = mode === "story" ? { mode, level } : { mode };
    try { game.current = StartGame("game-container", nextLaunch); }
    catch (error) {
      console.error("Phaser initialization failed", error);
      callbacks.current.onError?.("The adventure could not start. Please reload and try again.");
    }
    const instance = game.current;
    instance?.events.on("assets-progress", progress);
    instance?.events.on("assets-ready", ready);
    instance?.events.on("asset-error", assetError);
    const stopNavigation = game.current ? attachControllerNavigation(game.current) : () => {};
    if (typeof ref === "function") ref({ game: game.current, scene: null });
    else if (ref) ref.current = { game: game.current, scene: null };
    const resetKeys = () => game.current?.scene.getScenes(true).forEach((scene) => scene.input.keyboard?.resetKeys());
    window.addEventListener("blur", resetKeys);
    document.addEventListener("visibilitychange", resetKeys);
    return () => {
      window.removeEventListener("blur", resetKeys);
      document.removeEventListener("visibilitychange", resetKeys);
      stopNavigation();
      instance?.events.off("assets-progress", progress);
      instance?.events.off("assets-ready", ready);
      instance?.events.off("asset-error", assetError);
      instance?.destroy(true);
      game.current = null;
      if (typeof ref === "function") ref(null);
      else if (ref) ref.current = null;
    };
  }, [mode, level, ref]);
  return <div id="game-container" className="phaser-mount" role="region" aria-label="Game canvas" tabIndex={0} />;
});
