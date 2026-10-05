import type * as Phaser from "phaser";
export function preloadLevelMaps(scene: Phaser.Scene) {
    scene.load.tilemapTiledJSON("level_1", "levels/level_1.json");
    scene.load.tilemapTiledJSON("level_2", "levels/level_2.json");
    scene.load.tilemapTiledJSON("level_3", "levels/level_3.json");
    scene.load.tilemapTiledJSON("lobby", "levels/lobby.json");
    scene.load.tilemapTiledJSON("level_online", "levels/level_online.json");

    // For testing purposes
    // scene.load.tilemapTiledJSON("level_1", "levels/test_level.json");
}
