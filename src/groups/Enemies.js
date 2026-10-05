import * as Phaser from "phaser/dist/phaser.esm.js";
import Archer from "../entities/Archer";
import Bat from "../entities/Bat";
import Bee from "../entities/Bee";
import Boss from "../entities/Boss";
import Crossbow from "../entities/Crossbow";
import Mage from "../entities/Mage";
import Shield from "../entities/Shield";
import Skeleton from "../entities/Skeleton";
import Slime from "../entities/Slime";
import Spear from "../entities/Spear";
import Spider from "../entities/Spider";
import collidable from "../mixins/collidable";

const ENEMY_TYPES = {
    Skeleton,
    Archer,
    Mage,
    Slime,
    Bee,
    Spider,
    Boss,
    Shield,
    Spear,
    Bat,
    Crossbow,
};

class Enemies extends Phaser.GameObjects.Group {
    constructor(scene) {
        super(scene);

        Object.assign(this, collidable);
    }

    getProjectiles() {
        const projectiles = new Phaser.GameObjects.Group();

        this.getChildren().forEach((enemy) => {
            enemy.projectiles &&
                projectiles.addMultiple(enemy.projectiles.getChildren());
        });

        return projectiles;
    }

    getTypes() {
        return ENEMY_TYPES;
    }
}

export default Enemies;
