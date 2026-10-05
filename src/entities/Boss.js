import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/bossAnims.js";
import Enemy from "./BaseEnemy.js";

class Boss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "boss");
        initAnims(scene.anims);
    }

    init() {
        super.init();

        this.health = 700;
        this.setSize(180, 220);
        this.setOrigin(0.5, 0.75);

        this.setScale(1.3);

        this.damage = 20;
        this.attackDamage = 50;
        this.attackRange = 500;
        this.isAttacking = false;

        this.detectionRadius = 1000;
        this.verticalDistance = 300;

        this.timeFromLastAttack = 0;
        this.attackDelay = Phaser.Math.Between(2500, 3000);
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.active) {
            return;
        }

        if (this.body.velocity.x > 0) {
            this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
            this.setOffset(300, 240);
        } else {
            this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT;
            this.setOffset(350, 240);
        }

        if (!this.body.onFloor()) {
            return;
        }

        if (this.isAttacking) {
            // Stop moving if attacking
            this.setVelocity(0, 0);
            return;
        }

        if (
            this.isInAttackRange() &&
            Math.abs(this.player.y - this.y) <= 200 &&
            time > this.timeFromLastAttack + this.attackDelay
        ) {
            this.attackPlayer("boss-melee");

            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 3000);
        }

        if (this.isPlayingAnims("boss-melee")) {
            return;
        }

        if (this.health > 0) {
            this.play("boss-run", true);
        } else {
            this.play("boss-die", true);
        }
    }

    attackPlayer(anim) {
        this.isAttacking = true; // Set attacking flag to true

        // Stop all animations and play attack animation
        this.stop();
        this.play(anim, true);

        // Add an event listener for the specific frame (frame 8 in this example)
        this.on("animationupdate", this.onAttackFrame, this);
        this.once("animationcomplete", this.onAttackComplete, this);
    }

    onAttackFrame(animation, frame) {
        let deltaY = Math.abs(this.player.y - this.y);
        // Check if the animation is the boss-melee and it's frame 8
        if (animation.key === "boss-melee" && frame.index === 13) {
            // Deal damage to the player (you can customize this part)
            if (this.isInAttackRange() && deltaY <= 200) {
                this.scene.player.takesHit({ damage: this.attackDamage });
            }
        }
    }

    onAttackComplete(animation, frame) {
        if (animation.key === "boss-melee") {
            this.isAttacking = false; // Reset attacking flag
            this.off("animationupdate", this.onAttackFrame, this); // Remove frame listener
            this.off("animationcomplete", this.onAttackComplete, this); // Remove complete listener
        }
    }
}

export default Boss;
