import * as Phaser from "phaser/dist/phaser.esm.js";
import { getGameLaunch } from "@/lib/adventure-network";
import { generateRandomHint } from "../../utils/helpers";
import { preloadAudio } from "../preloaders/preloadAudio";
import { preloadCaveBg } from "../preloaders/preloadCaveBg";
import { preloadCollectibles } from "../preloaders/preloadCollectibles";
import { preloadForestBg } from "../preloaders/preloadForestBg";
import { preloadLevelMaps } from "../preloaders/preloadLevelMaps";
import { preloadProjectiles } from "../preloaders/preloadProjectiles";
import { preloadSpriteSheets } from "../preloaders/preloadSpriteSheets";
import { preloadTiles } from "../preloaders/preloadTiles";
import { preloadUI } from "../preloaders/preloadUI";

export default class Preloader extends Phaser.Scene {
  config: any; arrow!: Phaser.GameObjects.Image; dummy!: Phaser.GameObjects.Image; loadingText!: Phaser.GameObjects.Text; start: number; fontFamily = "customFont";
  constructor(config: any) { super("Preloader"); this.config = config; this.start = this.config.width / 10; }
  init() { this.setupUI(); generateRandomHint(this, this.config.width, this.config.height); }
  preload() {
    this.load.setPath("assets");
    this.load.image("logo", "logo.png"); this.load.image("github", "github.png"); this.load.image("linkedin", "linkedin.png"); this.load.image("gmail", "gmail.png");
    preloadAudio(this); preloadCaveBg(this); preloadCollectibles(this); preloadForestBg(this); preloadLevelMaps(this); preloadProjectiles(this); preloadSpriteSheets(this); preloadTiles(this); preloadUI(this);
    this.load.on("progress", this.updateLoadingBar, this);
    this.load.on("loaderror", (file: Phaser.Loader.File) => this.game.events.emit("asset-error", file.key));
  }
  setupUI() {
    this.add.image(this.config.width / 2, this.config.height / 2 - 120, "logo").setOrigin(0.5).setScale(0.6);
    this.loadingText = this.add.text(this.config.width / 2, this.config.height / 2 + 70, "Loading Adventure... 0%", { fontFamily: this.fontFamily, fontSize: "30px" }).setOrigin(0.5).setColor("#FFF");
    this.dummy = this.add.image(this.config.width / 1.1 + 50, this.config.height / 1.3, "dummy").setScale(1);
    this.arrow = this.add.image(this.start, this.config.height / 1.6, "arrow").setScale(1.1).setDepth(2);
  }
  updateLoadingBar(progress: number) {
    this.arrow.setX(this.start + progress * (this.dummy.x - 200 - this.start));
    this.loadingText.setText(`Loading Adventure... ${Math.round(progress * 100)}%`);
    this.game.events.emit("assets-progress", progress);
  }
  create() {
    const launch = getGameLaunch();
    this.registry.set("level", launch.mode === "story" ? launch.level : 1);
    this.registry.set("unlocked-levels", 3);
    this.game.events.emit("assets-ready");
    if (launch.mode === "multiplayer") this.scene.start("OnlinePlayScene");
    else if (launch.mode === "level-select") this.scene.start("LevelSelect");
    else this.scene.start("PlayScene", { gameStatus: "NEW_GAME" });
  }
}
