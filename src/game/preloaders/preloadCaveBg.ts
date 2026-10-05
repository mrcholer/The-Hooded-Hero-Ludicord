import type * as Phaser from "phaser";
export function preloadCaveBg(scene: Phaser.Scene) {
    // CAVE BACKGROUNDS

    scene.load.image("bg-cave-1", "backgrounds/bg_cave_1.png");
    scene.load.image("bg-cave-2", "backgrounds/bg_cave_2.png");
    scene.load.image("bg-cave-3", "backgrounds/bg_cave_3.png");
    scene.load.image("bg-cave-4", "backgrounds/bg_cave_4.png");
    scene.load.image("bg-cave-5", "backgrounds/bg_cave_5.png");
}
