import * as Phaser from "phaser/dist/phaser.esm.js";
import Boot from "./scenes/Boot";
import MainMenu from "./scenes/MainMenu";
import Preloader from "./scenes/Preloader";
import LevelSelect from "./scenes/LevelSelect";
import PlayScene from "./scenes/Play";
import OnlinePlayScene from "./scenes/multiplayer/OnlinePlay";
import Contact from "./scenes/secondary/Contact";
import Controls from "./scenes/secondary/Controls";
import CreditsScene from "./scenes/secondary/Credits";
import GameOverScene from "./scenes/secondary/GameOver";
import Loading from "./scenes/secondary/Loading";
import PauseScene from "./scenes/secondary/Pause";
import SettingsScene from "./scenes/secondary/Settings";
import VictoryScene from "./scenes/secondary/Victory";
import { setGameLaunch } from "@/lib/adventure-network";
import type { GameLaunch } from "@/lib/adventure-network";

const WIDTH = 1280;
const HEIGHT = 720;
const MAP_WIDTH = 16000;
const ZOOM_FACTOR = 0.5;
const SHARED_CONFIG = {
  mapOffset: MAP_WIDTH - WIDTH,
  width: WIDTH,
  height: HEIGHT,
  zoomFactor: ZOOM_FACTOR,
  leftTopCorner: { x: (WIDTH - WIDTH / ZOOM_FACTOR) / 2, y: (HEIGHT - HEIGHT / ZOOM_FACTOR) / 2 },
  rightTopCorner: { x: WIDTH / ZOOM_FACTOR + (WIDTH - WIDTH / ZOOM_FACTOR) / 2, y: (HEIGHT - HEIGHT / ZOOM_FACTOR) / 2 },
  rightBottomCorner: { x: WIDTH / ZOOM_FACTOR + (WIDTH - WIDTH / ZOOM_FACTOR) / 2, y: HEIGHT / ZOOM_FACTOR + (HEIGHT - HEIGHT / ZOOM_FACTOR) / 2 },
  lastLevel: 3,
};
const Scenes = [Boot, Preloader, MainMenu, SettingsScene, Contact, Controls, CreditsScene, LevelSelect, Loading, GameOverScene, VictoryScene, PauseScene, PlayScene, OnlinePlayScene];
const initScenes = () => Scenes.map((Scene: any) => new Scene(SHARED_CONFIG));

export default function StartGame(parent: string, launch: GameLaunch): Phaser.Game {
  setGameLaunch(launch);
  return new Phaser.Game({
    type: Phaser.AUTO,
    ...SHARED_CONFIG,
    parent,
    backgroundColor: "#05070b",
    pixelArt: true,
    physics: { default: "arcade", arcade: { debug: false, overlapBias: 8, tileBias: 32, fps: 60, fixedStep: true } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
    scene: initScenes(),
  });
}
