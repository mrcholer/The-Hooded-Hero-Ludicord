import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../animations/entities/crossbowAnims";
import ProjectileManager from "../attacks/ProjectileManager";
import Enemy from "./BaseEnemy";

class Crossbow extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "crossbow");
        initAnims(scene.anims);
    }

    init() {
        super.init();
        this.speed = 0;
        this.health = 120;
        this.damage = 25;
        this.isStationary = true;

        this.projectiles = new ProjectileManager(this.scene, "arrow");
        this.timeFromLastAttack = 0;
        this.attackDelay = Phaser.Math.Between(1000, 2000);

        this.setSize(150, 110);
        this.setVelocityX(0);
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.active) {
            return;
        }

        if (this.timeFromLastAttack + this.attackDelay <= time) {
            this.play("crossbow-attack", true);
            this.projectiles.fireProjectile(this, "arrow");

            this.timeFromLastAttack = time;
            this.attackDelay = Phaser.Math.Between(1000, 3500);
        }

        if (this.isPlayingAnims("crossbow-attack")) {
            return;
        }

        if (this.health <= 0) {
            this.play("crossbow-die", true);
        }
    }

    patrol() {
        if (!this.body || !this.body.onFloor()) {
            return;
        }
    }
}

export default Crossbow;
