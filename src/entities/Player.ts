// @ts-nocheck
import { addGameSound } from "@/lib/game-audio";
import { gameInput } from "@/lib/game-input";


import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnimations from "../animations/entities/playerAnims";
import MeleeWeapon from "../attacks/MeleeWeapon";
import ProjectileManager from "../attacks/ProjectileManager";
import EventEmitter from "../events/Emitter";
import HealthBar from "../hud/Healthbar";
import anims from "../mixins/anims";
import collidable from "../mixins/collidable";
import { getTimestamp } from "../utils/helpers";

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "player");

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Mixins (Adds methods from other objects to this current instance)
        Object.assign(this, collidable); // Add collidable methods
        Object.assign(this, anims); // Add animation methods

        // Initialize player properties and setup
        this.init();
        this.initEvents();

        this.debugText = this.scene.add
            .text(0, -300, "", { font: "32px Arial", fill: "#ff0000" })
            .setScrollFactor(0)
            .setDepth(30);

        this.graphics = this.scene.add.graphics().setDepth(30);
    }

    // Initialization method to set up player properties and components
    init() {
        this.initProperties(); // Initialize player-specific properties
        this.initSoundEffects(); // Load and set up sound effects for player actions
        this.initWeapons(); // Initialize player weapons (projectiles and melee)
        this.initHealthBar(); // Set up the health bar for the player
        this.initAnimations(); // Load and set up animations for the player
        this.initMovementSound(); // Set up movement sound effects

        this.damageNumbers = this.scene.add.group();
    }

    // Method to initialize player-specific properties
    initProperties() {
        // Set player-specific properties such as gravity, speed, health, etc.
        this.gravity = 2500;
        this.playerSpeed = 500;
        this.jumpCount = 0;
        this.consecutiveJumps = 1;
        this.hasBeenHit = false;
        this.isSliding = false;
        this.bounceVelocity = 400;
        this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
        this.timeFromLastSwing = null;

        // Set physics properties and initial position for the player
        this.body.setSize(60, 120); // Set collision body size
        this.body.setOffset(120, 60); // Offset collision body position
        this.body.setGravityY(this.gravity); // Set vertical gravity
        this.setCollideWorldBounds(true); // Enable collision with world bounds
        this.setOrigin(0.5, 0.5); // Set sprite origin for correct positioning
        this.body.setMaxVelocityY(1000);
    }

    // Method to initialize sound effects for player actions
    initSoundEffects() {
        this.jumpFx = addGameSound(this.scene, "jump", { volume: 0.2 });
        this.takeDamageFx = addGameSound(this.scene, "damage", { volume: 0.2 });
        this.arrowFx = addGameSound(this.scene, "projectile-launch", { volume: 1 });
        this.stepFx = addGameSound(this.scene, "step", { volume: 0.05 });
        this.swingSwordFx = addGameSound(this.scene, "swipe", { volume: 0.1 });
    }

    // Method to initialize player weapons (projectiles and melee)
    initWeapons() {
        // Create instances of ProjectileManager for firing arrows and MeleeWeapon for melee attacks
        this.projectiles = new ProjectileManager(this.scene, "arrow");
        this.meleeWeapon = new MeleeWeapon(this.scene, 0, 0, "sword-default");
    }

    // Method to initialize the health bar for the player
    initHealthBar() {
        // If healthbar already exists, destroy the health bar and text
        this.hp && this.hp.destroy();

        // Set initial health value and create a health bar instance
        this.health = 100;
        this.hp = new HealthBar(
            this.scene,
            this.scene.config.leftTopCorner.x + 150,
            this.scene.config.leftTopCorner.y + 25,
            2,
            this.health
        );
    }

    // Method to load and set up animations for the player
    initAnimations() {
        initAnimations(this.scene.anims);
    }

    // Method to set up repeating event to play footstep sound effects while the player is running
    initMovementSound() {
        this.scene.time.addEvent({
            delay: 350,
            repeat: -1,
            callbackScope: this,
            callback: () => {
                if (this.isPlayingAnims("run")) {
                    this.stepFx.play();
                }
            },
        });
    }

    // Method to initialize event listeners for player-specific events
    initEvents() {
        // Add an event listener for the UPDATE event of the scene, calling this.update method
        const scene = this.scene;
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
        this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
    }

    // Update method called on every frame to update player state and behaviors
    update() {
        const controls = gameInput.gameplay();
        // Skip update if player has been hit or is not existing in the scene
        if (this.hasBeenHit || !this.body?.enable) {
            return;
        }

        // Check if the player is out of bounds and handle movement
        this.checkOutOfBounds();
        this.handleMovement(controls);
        if (controls.bow) this.handleProjectileAttack();
        if (controls.sword) this.handleMeleeAttack();

        // this.addDebugger()
    }

    // Method to check if the player is out of bounds and trigger appropriate actions
    checkOutOfBounds() {
        // Emit PLAYER_LOSE event if player's top boundary exceeds a certain threshold
        if (this.getBounds().top > this.scene.config.height * 2.5) {
            EventEmitter.emit("RESPAWN");
        }
    }

    // Method to handle player movement based on keyboard input
    handleMovement(controls) {
        const onFloor = this.body.onFloor();

        // Handle horizontal movement based on left and right arrow keys
        this.handleRunning(controls.sprint, onFloor);
        this.handleHorizontalMovement(controls.horizontal);

        // Handle jumping when space key is pressed and player is on the floor
        this.handleJumping(controls.jump, onFloor);

        // Prevent animation overlap during specific actions (e.g., shooting arrow or melee attack)
        if (
            this.isPlayingAnims("shoot-arrow") ||
            this.isPlayingAnims("melee")
        ) {
            return;
        }

        // Update player animation based on current state (running, idle, jumping)
        this.updatePlayerAnimation(onFloor);
    }

    // Method to handle horizontal movement of the player
    handleHorizontalMovement(horizontal) {
        // Move player left or right based on keyboard input and update facing direction
        if (horizontal < 0) {
            this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT;
            this.setVelocityX(horizontal * this.playerSpeed);
            this.setFlipX(true);
        } else if (horizontal > 0) {
            this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
            this.setVelocityX(horizontal * this.playerSpeed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0); // Stop horizontal movement if no keys are pressed
        }
    }

    // Method to handle jumping behavior of the player
    handleJumping(isSpaceJustDown, onFloor) {
        // Execute jump when space key is pressed and player is on the floor or has remaining jumps
        if (
            isSpaceJustDown &&
            (onFloor || this.jumpCount < this.consecutiveJumps)
        ) {
            this.jumpFx.play(); // Play jump sound effect
            this.setVelocityY(-1000); // Set vertical velocity for jumping
            this.jumpCount++; // Increment jump count
        }

        // Reset jump count if player is back on the floor
        if (onFloor) {
            this.jumpCount = 0;
        }
    }

    // Method to handle running (increased speed) when shift key is pressed
    handleRunning(sprint, onFloor) {
        // Increase player speed when shift key is pressed and player is on the floor
        if (sprint && onFloor) {
            this.playerSpeed = 650;
        } else {
            this.playerSpeed = 500; // Reset speed to default if shift key is released
        }
    }

    // Method to update player animation based on current state (running, idle, jumping)
    updatePlayerAnimation(onFloor) {
        // Play appropriate animation based on player's movement and state
        onFloor
            ? this.body.velocity.x !== 0
                ? this.play("run", true)
                : this.play("idle", true)
            : this.play("jump", true);
    }

    // Method to handle projectile (arrow) attack
    handleProjectileAttack() {
        const delay = 300; // Delay for coordinating animation and sound effect
        this.play("shoot-arrow", true); // Play shoot arrow animation
        this.scene.time.delayedCall(delay, () => this.arrowFx.play()); // Play projectile launch sound effect
        this.scene.time.delayedCall(delay, () => this.projectiles.fireProjectile(this, "arrow")); // Fire projectile
    }

    // Method to handle melee attack (sword swing)
    handleMeleeAttack() {
        // Check if enough time has passed since the last melee attack to prevent rapid swings
        if (
            this.timeFromLastSwing &&
            this.timeFromLastSwing + this.meleeWeapon.attackSpeed >
                getTimestamp()
        ) {
            return;
        }

        // Play sword swing sound effect and melee attack animation
        this.swingSwordFx.play();
        this.play("melee", true);

        // Perform melee attack with the melee weapon instance
        this.meleeWeapon.swing(this);

        // Record timestamp of the last melee attack
        this.timeFromLastSwing = getTimestamp();
    }

    // Method to create a tint animation when the player takes damage
    playDamageTween() {
        return this.scene.tweens.add({
            targets: this,
            alpha: 50,
            duration: 250,
            ease: "Power1",
            yoyo: true,
            tint: 0x999999,
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
                color: "#ff0000",
            }
        );

        damageText.setOrigin(0.5, 0.5);
        damageText.setDepth(3);

        this.damageNumbers.add(damageText);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y,
            alpha: 0,
            duration: 1000,
            ease: "Cubic.Out",
            onComplete: () => {
                damageText.destroy();
            },
        });
    }

    // Method to bounce the player off a source (e.g., enemy or obstacle)
    bounceOff(source) {
        // Determine direction to bounce based on collision and set velocities
        if (source.body) {
            this.body.touching.right
                ? this.setVelocityX(-this.bounceVelocity)
                : this.setVelocityX(this.bounceVelocity);
        } else {
            this.body.blocked.right
                ? this.setVelocityX(-this.bounceVelocity)
                : this.setVelocityX(this.bounceVelocity);
        }

        // Apply vertical velocity to bounce upward
        this.scene.time.delayedCall(0, () => this.setVelocityY(-this.bounceVelocity));
    }

    // Method to handle player taking damage from a source (enemy or projectile)
    takesHit(source) {
        // Play damage sound effect and check if player has already been hit
        this.takeDamageFx.play();
        if (this.hasBeenHit) {
            return;
        }

        // Reduce player health based on damage from the source
        this.health -= source.damage || source.properties?.damage || 0;

        // Trigger PLAYER_LOSE event if player health drops to zero
        if (this.health <= 0) {
            // this.play("player-die", true);
            EventEmitter.emit("RESPAWN");
            return;
        } else {
            this.showDamageNumber(source.damage);
        }

        // Apply hit reaction: bounce off, play damage animation, and update health bar
        this.hasBeenHit = true;
        this.bounceOff(source);
        const hitAnim = this.playDamageTween();
        this.hp.decrease(this.health); // Update health bar with reduced health

        // Trigger hit effect on the source of damage (e.g., enemy or projectile)
        source.deliversHit && source.deliversHit(this);

        // Reset hit state and animation tint after a delay
        this.scene.time.delayedCall(500, () => {
            this.hasBeenHit = false;
            hitAnim.stop();
            this.clearTint();
        });
    }

    addDebugger() {
        if (this.body) {
            this.debugText.setText(
                `x: ${this.x.toFixed(0)}, y: ${this.y.toFixed(0)}\n` +
                    `velocityX: ${this.body.velocity.x.toFixed(
                        0
                    )}, velocityY: ${this.body.velocity.y.toFixed(0)}\n`
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

export default Player;
