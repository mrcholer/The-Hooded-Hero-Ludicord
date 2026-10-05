import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/beeAnims";
import Enemy from "./BaseEnemy";

class Bee extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "bee");
        initAnims(scene.anims);
        this.position = new Phaser.Math.Vector2(x, y); // Store position as a vector
    }

    init() {
        super.init();
        this.health = 120;
        this.setSize(80, 180);
        this.setScale(0.9);
        this.canFly = true;

        this.damage = 5; // Damage from contact
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

        // Perform attack if player is in range and enough time has passed since last attack
        if (
            this.isInAttackRange() &&
            time > this.timeFromLastAttack + this.attackDelay
        ) {
            this.attackPlayer("bee-attack");
            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 3000);
        }

        if (this.isPlayingAnims("bee-attack")) {
            return;
        }

        if (this.health > 0) {
            this.play("bee-fly", true);
        } else {
            this.play("bee-die", true);
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
        if (animation.key === "bee-attack") {
            // Deal damage to the player (you can customize this part)
            if (this.isInAttackRange()) {
                this.scene.player.takesHit({ damage: this.attackDamage });
            }

            this.off("animationcomplete", this.onAttackComplete, this); // Remove the event listener
        }
    }
}

export default Bee;
