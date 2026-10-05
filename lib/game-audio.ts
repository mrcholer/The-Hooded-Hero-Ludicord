import type * as Phaser from "phaser";

const MUSIC_KEYS = new Set(["menu-theme", "forest-theme", "cave-theme", "boss-theme", "online-theme", "sakura-theme"]);

/** Retains each original sound's mix while applying the player's saved volume. */
export function addGameSound(scene: Phaser.Scene, key: string, config: Phaser.Types.Sound.SoundConfig = {}) {
  const preference = MUSIC_KEYS.has(key) ? "music" : "sfx";
  const defaultVolume = preference === "music" ? 40 : 65;
  const saved = Number(localStorage.getItem(`hoodedHero.${preference}`) ?? defaultVolume);
  const scale = Number.isFinite(saved) ? Math.max(0, Math.min(100, saved)) / 100 : defaultVolume / 100;
  const sound = scene.sound.add(key, { ...config, volume: (config.volume ?? 1) * scale });
  scene.events.once("shutdown", () => sound.destroy());
  return sound;
}
