// @ts-nocheck

import * as Phaser from "phaser/dist/phaser.esm.js";
import { getTimestamp } from "../utils/helpers";
import Projectile from "./Projectile";

class ProjectileManager extends Phaser.Physics.Arcade.Group {
    constructor(scene, key) {
        super(scene.physics.world, scene);

        // Create multiple instances of Projectile within the group
        this.createMultiple({
            frameQuantity: 5, // Number of projectiles to create
            active: false, // Start with projectiles inactive
            visible: false, // Start with projectiles invisible
            key, // Key for the projectile texture
            classType: Projectile, // Type of objects to create in this group
        });

        // Initialize the timestamp for tracking cooldown between shots
        this.timeFromLastProjectile = null;
    }

    // Method to fire a projectile from an entity
    fireProjectile(entity, anim) {
        // Get the first inactive projectile from the group
        const projectile = this.getFirstDead(false);

        // If no inactive projectiles are available, return
        if (!projectile) return;

        // Check if the projectile is still in cooldown
        if (this.isInCooldown(projectile)) return;

        // Calculate the center position where the projectile will start
        const { centerX, centerY } = this.getProjectilePosition(
            entity,
            projectile
        );

        // Launch the projectile with the calculated position and animation
        this.launchProjectile(projectile, centerX, centerY, anim);

        // Record the timestamp of the last projectile fired
        this.timeFromLastProjectile = getTimestamp();
    }

    // Helper function to check if the projectile is still in cooldown
    isInCooldown(projectile) {
        return (
            this.timeFromLastProjectile &&
            this.timeFromLastProjectile + projectile.cooldown > getTimestamp()
        );
    }

    // Helper function to determine the starting position of the projectile
    getProjectilePosition(entity, projectile) {
        // Get the center position of the entity that fires the projectile
        const entityCenter = entity.getCenter();
        let centerX;

        // Determine the direction and position of the projectile based on the entity's facing direction
        if (entity.lastDirection === Phaser.Physics.Arcade.FACING_RIGHT) {
            projectile.speed = Math.abs(projectile.speed);
            projectile.setFlipX(false); // Set projectile orientation
            centerX = entityCenter.x + 10; // Offset from entity center for right direction
        } else {
            projectile.speed = -Math.abs(projectile.speed);
            projectile.setFlipX(true); // Set projectile orientation
            centerX = entityCenter.x - 10; // Offset from entity center for left direction
        }

        // Calculate the vertical position of the projectile relative to the entity
        const centerY = entityCenter.y + 25;
        return { centerX, centerY };
    }

    // Method to launch the projectile
    launchProjectile(projectile, x, y, anim) {
        // Activate and launch the projectile with specified position and animation
        projectile.fire(x, y, anim);
    }
}

export default ProjectileManager;
