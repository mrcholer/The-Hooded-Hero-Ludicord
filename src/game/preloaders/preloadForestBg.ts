import type * as Phaser from "phaser";
export function preloadForestBg(scene: Phaser.Scene) {
    // FOREST BACKGROUNDS

    scene.load.image("bg-forest-1", "backgrounds/bg_forest_1.png");
    scene.load.image("bg-forest-2", "backgrounds/bg_forest_2.png");
    scene.load.image("bg-forest-3", "backgrounds/bg_forest_3.png");
    scene.load.image("mountain-bg", "backgrounds/mountain_bg.png");
    scene.load.image("sky-bg", "backgrounds/sky_bg.png");
    scene.load.image("leaf", "backgrounds/leaf.png");
    scene.load.image("tree-1", "backgrounds/tree1.png");
    scene.load.image("tree-2", "backgrounds/tree2.png");
}
