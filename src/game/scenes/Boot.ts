import * as Phaser from "phaser/dist/phaser.esm.js";

export default class Boot extends Phaser.Scene {
  constructor() { super("Boot"); }
  preload() {
    this.load.setPath("assets");
    this.load.image("logo", "logo.png");
    this.load.image("dummy", "dummy.png");
    this.load.image("arrow", "weapons/arrow.png");
  }
  create() { this.scene.start("Preloader"); }
}
