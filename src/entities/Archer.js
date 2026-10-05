import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/archerAnims";
import ProjectileManager from "../attacks/ProjectileManager";
import Enemy from "./BaseEnemy";

class Archer extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "archer");
        initAnims(scene.anims);
    }

    init() {
        super.init();
        this.speed = 150;
        this.health = 200;
        this.setSize(120, 170);

        this.damage = 20;
        this.attackRange = 1000;
        this.isAttacking = false;

        this.detectionRadius = 1000;

        this.attackDelay = Phaser.Math.Between(2000, 4000);
        this.timeFromLastAttack = 0;

        this.projectiles = new ProjectileManager(this.scene, "arrow");

        this.lastDirection = null;
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.active) {
            return;
        }

        if (this.body.velocity.x > 0) {
            this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
        } else {
            this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT;
        }

        if (!this.body.onFloor()) {
            return;
        }

        if (this.isAttacking) {
            this.setVelocity(0, 0);
            return;
        }

        if (
            this.isInAttackRange() &&
            time > this.timeFromLastAttack + this.attackDelay
        ) {
            this.attackPlayer("archer-attack");
            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 2000);
        }

        if (this.isPlayingAnims("archer-attack")) {
            return;
        }

        if (this.health > 0) {
            this.play("archer-run", true);
        } else {
            this.play("archer-die", true);
        }
    }

    attackPlayer(anim) {
        this.isAttacking = true; // Set attacking flag to true

        this.stop();
        this.play(anim, true);
        this.projectiles.fireProjectile(this, "arrow");

        this.isAttacking = false; // Reset attacking flag
    }
}

export default Archer;
