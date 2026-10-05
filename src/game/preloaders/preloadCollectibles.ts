import type * as Phaser from "phaser";
// COLLECTIBLES
export function preloadCollectibles(scene: Phaser.Scene) {
    scene.load.spritesheet("coin-spin", "collectibles/coin_spin.png", {
        frameWidth: 42,
        frameHeight: 42,
    });
}
