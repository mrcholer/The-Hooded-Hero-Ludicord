// @ts-nocheck

import * as Phaser from "phaser/dist/phaser.esm.js";
import EffectManager from "../effects/EffectManager";

class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key) {
        super(scene, x, y, key);

        // Add the projectile to the scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Initialize properties based on the projectile type
        this.initProperties(key);

        // Create an effect manager for handling effects
        this.effectManager = new EffectManager(this.scene);
    }

    // Initialize properties based on the projectile type
    initProperties(key) {
        // Determine speed and maximum distance based on the projectile type
        this.speed = key === "arrow" ? 1500 : 500;
        this.maxDistance = key === "arrow" ? 5000 : 4000;

        // Set body size if the projectile is not an arrow
        if (key !== "arrow") {
            this.body.setCircle(15);
            this.setOffset(10, 15);
            this.setRotation(Phaser.Math.DegToRad(90));
            this.setScale(3);
        }

        // Set other properties such as damage and cooldown based on the projectile type
        this.damage = key === "arrow" ? 20 : 30;
        this.cooldown = 250;

        // Initialize traveled distance to track how far the projectile has traveled
        this.traveledDistance = 0;
    }

    // Update method called automatically by Phaser each frame
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Update traveled distance based on the projectile's movement
        this.traveledDistance += this.body.deltaAbsX();

        // Check if the projectile is out of range
        if (this.isOutOfRange()) {
            // Reset the projectile's position and deactivate it
            this.body.reset(0, 0);
            this.activateProjectile(false);
            this.traveledDistance = 0;
        }
    }

    // Fire method to activate the projectile and set its initial position and velocity
    fire(x, y, anim) {
        this.activateProjectile(true);
        this.body.reset(x, y);
        this.setVelocityX(this.speed);

        // Play animation if provided
        anim && this.play(anim, true);
    }

    // Handle delivering a hit to a target
    deliversHit(target) {
        // Trigger hit effect at the impact position
        const impactPosition = { x: this.x, y: this.y };
        this.effectManager.playEffectOn("hit-effect", target, impactPosition);

        // Deactivate the projectile and reset its position
        this.activateProjectile(false);
        this.traveledDistance = 0;
        this.body.reset(0, 0);
    }

    // Activate or deactivate the projectile
    activateProjectile(isActive) {
        this.setActive(isActive);
        this.setVisible(isActive);
    }

    // Check if the projectile is out of range based on traveled distance
    isOutOfRange() {
        return this.traveledDistance >= this.maxDistance;
    }
}

export default Projectile;
