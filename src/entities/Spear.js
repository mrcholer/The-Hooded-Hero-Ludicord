import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/spearAnims";
import Enemy from "./BaseEnemy";

class Spear extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "spear");
        initAnims(scene.anims);
    }

    init() {
        super.init();

        this.health = 300;
        this.setSize(80, 150);
        this.setScale(1.1);

        this.damage = 10;
        this.attackDamage = 30; // Damage from attacks
        this.attackRange = 200;
        this.isAttacking = false;

        this.attackDelay = Phaser.Math.Between(0, 1000);
        this.timeFromLastAttack = 0;
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.active) {
            return;
        }

        if (this.body.velocity.x > 0) {
            this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
            this.setOffset(90, 0);
        } else {
            this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT;
            this.setOffset(180, 0);
        }

        if (!this.body.onFloor()) {
            return;
        }

        if (this.isAttacking) {
            // Stop moving if attacking
            this.setVelocity(0, 0);
            return;
        }

        // Perform attack if player is in range and enough time has passed since last attack
        if (
            this.isInAttackRange() &&
            time > this.timeFromLastAttack + this.attackDelay
        ) {
            this.attackPlayer("spear-attack");
            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 2000);
        }

        if (this.isPlayingAnims("spear-attack")) {
            return;
        }

        if (this.health > 0) {
            this.play("spear-run", true);
        } else {
            this.play("spear-die", true);
        }
    }

    attackPlayer(anim) {
        this.isAttacking = true; // Set attacking flag to true

        this.stop();
        this.play(anim, true);

        this.on("animationupdate", this.onAttackFrame, this);
        this.once("animationcomplete", this.onAttackComplete, this);
    }

    onAttackFrame(animation, frame) {
        if (animation.key === "spear-attack" && frame.index === 9) {
            if (this.isInAttackRange()) {
                this.scene.player.takesHit({ damage: this.attackDamage });
            }
        }
    }

    onAttackComplete(animation, frame) {
        if (animation.key === "spear-attack") {
            this.isAttacking = false; // Reset attacking flag
            this.off("animationupdate", this.onAttackFrame, this); // Remove frame listener
            this.off("animationcomplete", this.onAttackComplete, this); // Remove complete listener
        }
    }
}

export default Spear;
