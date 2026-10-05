import type * as Phaser from "phaser";
// PROJECTILES
export function preloadProjectiles(scene: Phaser.Scene) {
    // CROSSBOW
    scene.load.image("crossbow", "objects/crossbow.png");
    // ARROW
    scene.load.image("arrow", "weapons/arrow.png");

    // FIREBALL
    scene.load.image("fire-1", "projectiles/fire_0.png");

    scene.load.spritesheet("fire-animation", "projectiles/fire.png", {
        frameWidth: 48,
        frameHeight: 66,
    });

    // CROSSBOW
    scene.load.image("crossbow", "objects/crossbow.png");
}
