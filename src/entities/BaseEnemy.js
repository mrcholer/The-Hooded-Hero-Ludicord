import { addGameSound } from "@/lib/game-audio";
// Import Phaser library if not already imported
import * as Phaser from "phaser/dist/phaser.esm.js";

// Import mixins for additional functionality
import anims from "../mixins/anims";
import collidable from "../mixins/collidable";

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key) {
        super(scene, x, y, key);

        // Store scene configuration for access throughout the class
        this.config = scene.config;

        // Add the enemy to the scene and enable physics for it
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Mix in additional methods from collidable and anims mixins
        Object.assign(this, collidable);
        Object.assign(this, anims);

        // Initialize enemy properties and setup
        this.init();
        this.initEvents();

        // Add custom debug text
        this.debugText = this.scene.add
            .text(500, -300, "", { font: "32px Arial", fill: "#0000ff" })
            .setScrollFactor(0)
            .setDepth(30);

        this.graphics = this.scene.add.graphics().setDepth(30);
    }

    // Initialize properties and settings for the enemy
    init() {
        this.gravity = 500;
        this.speed = 200;
        this.maxPatrolDistance = Phaser.Math.Between(2000, 4000);
        this.currentPatrolDistance = 0;
        this.timeFromLastTurn = 0;

        this.health = 100;
        this.damage = 10;

        this.verticalDistance = 100;
        this.detectionRadius = 500; // Radius to detect the player
        this.playerDetected = false; // Flag to indicate if the enemy is following the player
        this.attackRange = 100;

        // Sound effect for when the enemy takes damage
        this.takeDamageSound = addGameSound(this.scene, "enemy-damage", {
            volume: 0.1,
        });

        // Set initial physics properties for the enemy
        this.body.setGravityY(this.gravity);
        this.setCollideWorldBounds(true);
        this.setImmovable(true);
        this.setOrigin(0.5, 0.5);
        this.setVelocityX(this.speed);

        // Initialize damage number properties
        this.damageNumbers = this.scene.add.group();

        // Initialize blinking properties
        this.blinkTween = null;

        this.player = this.scene.player;
        this.canFly = false;
        this.isStationary = false;

        // Graphics object to visualize raycast and detection radius for debugging
        this.rayGraphics = this.scene.add.graphics({
            lineStyle: { width: 2, color: 0xaa00aa },
        });

        this.detectionGraphics = this.scene.add.graphics({
            lineStyle: { width: 2, color: 0xff0000 },
        });
    }

    // Initialize events, such as the update loop for the enemy
    initEvents() {
        const scene = this.scene;
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
        this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
    }

    // Set the platform colliders layer for the enemy
    setPlatformColliders(platformCollidersLayer) {
        this.platformCollidersLayer = platformCollidersLayer;
    }

    // Update method called automatically by Phaser
    update(time) {
        if (!this.active) {
            return;
        }

        // Check if the enemy has fallen below a certain point and destroy it if so
        if (this.getBounds().bottom > 2000) {
            this.destroyEnemy();
            return;
        }

        if (this.player) {
            // Detect the player
            this.detectPlayer();

            // If following the player, move towards the player
            if (!this.isStationary) {
                if (this.playerDetected) {
                    this.followPlayer();
                } else {
                    this.patrol(time);
                }
            }
        }

        // Handle blinking when health is below 40%
        if (this.health < 40) {
            this.playLowHealthTween();
        }

        // this.addDebugger();
    }

    // Detect if the player is within the detection radius
    detectPlayer() {
        let distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.player.x,
            this.player.y
        );

        let verticalDistanceFromPlayer = Math.abs(
            Math.floor(this.player.y - this.y)
        );

        // Check if the player is within the detection radius
        if (
            (this.canFly && distance <= this.detectionRadius) ||
            (!this.canFly &&
                distance <= this.detectionRadius &&
                verticalDistanceFromPlayer <= this.verticalDistance)
        ) {
            this.playerDetected = true;
        } else {
            this.playerDetected = false;
        }
    }

    followPlayer() {
        if (this.canFly) {
            this.scene.physics.moveToObject(this, this.player, 350);
            this.setFlipX(this.player.x < this.x);
        } else {
            if (this.player.x < this.x) {
                this.setVelocityX(-300);
                this.setFlipX(true);
            } else {
                this.setVelocityX(300);
                this.setFlipX(false);
            }
        }
    }

    patrol(time) {
        // Skip patrolling if the enemy is not on the floor
        if (!this.body || !this.body.onFloor()) {
            return;
        }

        // Track the distance traveled during patrolling
        this.currentPatrolDistance += Math.abs(this.body.deltaX());

        // Perform a raycast to detect obstacles in front of the enemy
        const { ray, hasHit } = this.raycast(
            this.body,
            this.platformCollidersLayer,
            {
                precision: 1,
                steepness: 0.2,
            }
        );

        // Change direction if no obstacles are ahead or maximum distance is reached
        if (
            (!hasHit || this.currentPatrolDistance >= this.maxPatrolDistance) &&
            this.timeFromLastTurn + 100 < time
        ) {
            this.turnAround(time);
        }

        // Check if the enemy is stationary
        if (this.body.velocity.x === 0) {
            this.turnAround(time);
        }

        // Display the raycast for debugging purposes if debug mode is enabled
        if (this.config.debug && ray) {
            // Draw raycast
            this.drawRayCast(ray);

            // Draw detection radius for debugging
            this.drawDetectionRadius();
        }
    }

    // Play a damage animation and effects when the enemy takes a hit
    takesHit(source) {
        // Play the damage sound effect
        this.takeDamageSound.play();

        // Prevent taking multiple hits simultaneously
        if (this.hasBeenHit) {
            return;
        }

        // Mark the enemy as hit and trigger hit effects
        this.hasBeenHit = true;
        source.deliversHit(this);
        const hitAnim = this.playDamageTween();

        // Reset hit state and effects after a delay
        this.scene.time.delayedCall(250, () => {
            this.hasBeenHit = false;
            hitAnim.stop();
            this.clearTint();
        });

        // Reduce enemy health and handle death if health drops to zero
        this.health -= source.damage;
        if (this.health <= 0) {
            this.die();
        } else {
            // Show damage number above the enemy
            this.showDamageNumber(source.damage);
        }
    }

    // Perform actions when the enemy dies
    die() {
        // Disable physics and gravity
        this.body.setEnable(false);
        this.body.setGravityY(0);

        // Move the enemy downwards
        this.setVelocity(0, 100); // Adjust the velocity as needed

        // Optionally, destroy the enemy after a delay
        this.scene.time.delayedCall(500, () => {
            this.destroy();
        });
    }

    // Check if the player is within attack range
    isInAttackRange() {
        if (!this.player) {
            return false;
        }

        let distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.player.x,
            this.player.y
        );

        return distance <= this.attackRange;
    }

    // Destroy the enemy instance
    destroyEnemy() {
        // Remove update event listener, deactivate enemy, clear raycast graphics, and destroy
        this.scene.events.removeListener(
            Phaser.Scenes.Events.UPDATE,
            this.update,
            this
        );
        this.setActive(false);
        this.rayGraphics.clear();
        this.detectionGraphics.clear();
        this.destroy();
    }

    // Perform a turn around action (change direction)
    turnAround(time) {
        // Reverse its movement direction
        this.setVelocityX((this.speed = -this.speed));
        this.setFlipX(this.body.velocity.x < 0);
        this.currentPatrolDistance = 0;
        this.timeFromLastTurn = time;
    }

    // Start blinking effect when health is below 40%
    playLowHealthTween() {
        if (!this.blinkTween) {
            this.blinkTween = this.scene.tweens.add({
                targets: this,
                alpha: 50,
                duration: 250,
                ease: "Power1",
                yoyo: true,
                repeat: -1,
                tint: 0xff0000,
            });
        }
    }

    // Play a damage animation tween effect
    playDamageTween() {
        return this.scene.tweens.add({
            targets: this,
            alpha: 50,
            duration: 250,
            ease: "Power1",
            yoyo: true,
            tint: 0x222222,
        });
    }

    // Show damage number above the enemy
    showDamageNumber(damage) {
        const damageText = this.scene.add.text(
            this.x,
            this.y - 100,
            `${damage}`,
            {
                fontFamily: "customFont",
                fontSize: 75,
                color: "#ffff00",
            }
        );

        damageText.setOrigin(0.5, 0.5);
        damageText.setDepth(1);

        this.damageNumbers.add(damageText);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: "Cubic.Out",
            onComplete: () => {
                damageText.destroy();
            },
        });
    }

    drawRayCast(ray) {
        this.rayGraphics.clear();
        this.rayGraphics.strokeLineShape(ray);
    }

    // Draw the detection radius for debugging purposes
    drawDetectionRadius() {
        this.detectionGraphics.clear();
        this.detectionGraphics.strokeCircle(
            this.x,
            this.y,
            this.detectionRadius
        );
    }

    addDebugger() {
        // Update custom debug information if the body exists
        if (this.body) {
            const { hasHit } = this.raycast(
                this.body,
                this.platformCollidersLayer,
                {
                    precision: 1,
                    steepnes: 0.2,
                }
            );

            this.debugText.setText(
                `x: ${this.x.toFixed(0)}, y: ${this.y.toFixed(0)}\n` +
                    `velocityX: ${this.body.velocity.x.toFixed(
                        0
                    )}, velocityY: ${this.body.velocity.y.toFixed(0)}\n` +
                    `deltaX: ${
                        this.scene.player.x.toFixed(0) - this.x.toFixed(0)
                    }, deltaY: ${
                        this.scene.player.y.toFixed(0) - this.y.toFixed(0)
                    }`
            );

            this.graphics.clear(); // Clear previous drawings
            this.graphics.lineStyle(2, 0xff0000); // Line style: thickness (2 pixels), color (red)
            this.graphics.beginPath();
            this.graphics.moveTo(this.x, this.y);
            this.graphics.lineTo(500, 100); // Fixed point example
            this.graphics.strokePath();
        }
    }
}

export default Enemy;
