import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/skeletonAnims";
import Enemy from "./BaseEnemy";

class Skeleton extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "skeleton");
        initAnims(scene.anims);
    }

    init() {
        super.init();

        this.health = 200;
        this.setSize(80, 150);

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
            this.attackPlayer("skeleton-attack");
            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 2000);
        }

        if (this.isPlayingAnims("skeleton-attack")) {
            return;
        }

        if (this.health > 0) {
            this.play("skeleton-run", true);
        } else {
            this.play("skeleton-die", true);
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
        if (animation.key === "skeleton-attack" && frame.index === 6) {
            if (this.isInAttackRange()) {
                this.scene.player.takesHit({ damage: this.attackDamage });
            }
        }
    }

    onAttackComplete(animation, frame) {
        if (animation.key === "skeleton-attack") {
            this.isAttacking = false; // Reset attacking flag
            this.off("animationupdate", this.onAttackFrame, this); // Remove frame listener
            this.off("animationcomplete", this.onAttackComplete, this); // Remove complete listener
        }
    }
}

export default Skeleton;
