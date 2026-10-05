import initAnims from "../animations/entities/slimeAnims";
import Enemy from "./BaseEnemy";

class Slime extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "slime");
        initAnims(scene.anims);
    }

    init() {
        super.init();
        this.setSize(120, 100);
        this.setOffset(65, 50);
        this.setScale(1.1);

        this.health = 100;
        this.damage = 10;
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.active) {
            return;
        }

        if (!this.body.onFloor()) {
            return;
        }

        if (this.health > 0) {
            this.play("slime-run", true);
        } else {
            this.play("slime-die", true);
        }
    }
}

export default Slime;
