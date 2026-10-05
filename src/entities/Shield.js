import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/shieldAnims";
import Enemy from "./BaseEnemy";

class Shield extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "shield");
        initAnims(scene.anims);
    }

    init() {
        super.init();

        this.health = 300;
        this.setSize(80, 160);
        this.setScale(1.2);

        this.damage = 10;
        this.attackDamage = 30; // Damage from attacks
        this.attackRange = 180;
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
            this.setOffset(120, 0);
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
            this.attackPlayer("shield-attack");
            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 2000);
        }

        if (this.isPlayingAnims("shield-attack")) {
            return;
        }

        if (this.health > 0) {
            this.play("shield-run", true);
        } else {
            this.play("shield-die", true);
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
        if (animation.key === "shield-attack" && frame.index === 6) {
            if (this.isInAttackRange()) {
                this.scene.player.takesHit({ damage: this.attackDamage });
            }
        }
    }

    onAttackComplete(animation, frame) {
        if (animation.key === "shield-attack") {
            this.isAttacking = false; // Reset attacking flag
            this.off("animationupdate", this.onAttackFrame, this); // Remove frame listener
            this.off("animationcomplete", this.onAttackComplete, this); // Remove complete listener
        }
    }
}

export default Shield;
