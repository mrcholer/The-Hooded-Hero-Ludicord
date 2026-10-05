import type * as Phaser from "phaser";
export function preloadTiles(scene: Phaser.Scene) {
    scene.load.image("forest-tiles", "tilesets/tileset_1.png");
    scene.load.image("cave-tiles", "tilesets/tileset_2.png");
    scene.load.image("environment-tiles", "tilesets/environment.png");
    scene.load.image("house-tiles", "tilesets/house_inside_4.png");

    scene.load.image("dummy", "dummy.png");

    // scene.load.image("bg-spikes-tileset", "bg_spikes_tileset.png");
}
