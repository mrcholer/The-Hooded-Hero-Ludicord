import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/spiderAnims";
import Enemy from "./BaseEnemy";

class Spider extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "spider");
        initAnims(scene.anims);
    }

    init() {
        super.init();

        this.health = 150;
        this.setSize(120, 90);
        this.setOffset(30, 20);
        this.setScale(0.9);

        this.damage = 5;
        this.attackDamage = 20; // Damage from attacks
        this.attackRange = 200;

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

        // Perform attack if player is in range and enough time has passed since last attack
        if (
            this.isInAttackRange() &&
            time > this.timeFromLastAttack + this.attackDelay
        ) {
            this.attackPlayer("spider-attack");
            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 2000);
        }

        if (this.isPlayingAnims("spider-attack")) {
            return;
        }

        if (this.health > 0) {
            this.play("spider-run", true);
        } else {
            this.play("spider-die", true);
        }
    }

    attackPlayer(anim) {
        // Stop all animations and play attack animation
        this.stop();
        this.play(anim);

        // Add an event listener for the animation complete event
        this.on("animationcomplete", this.onAttackComplete, this);
    }

    onAttackComplete(animation, frame) {
        if (animation.key === "spider-attack") {
            // Deal damage to the player (you can customize this part)
            if (this.isInAttackRange()) {
                this.scene.player.takesHit({ damage: this.attackDamage });
            }

            this.off("animationcomplete", this.onAttackComplete, this); // Remove the event listener
        }
    }
}

export default Spider;
