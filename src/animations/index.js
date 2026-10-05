import createCoinAnimations from "./collectables/coinAnims";
import createFireAnimations from "./projectiles/fireAnims";
import createAxeAnimations from "./weapons/axeAnims";
import createSwordAnimations from "./weapons/swordAnims";

const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        // --- Effect animations ---
        anims.create({
            key: "hit-effect",
            frames: anims.generateFrameNumbers("hit-sheet", {
                start: 0,
                end: 4,
            }),
            frameRate: 30,
            repeat: 0,
        });

        // --- Weapon animations ---

        createSwordAnimations(anims);
        createAxeAnimations(anims);

        // --- Projectile animations ---

        anims.create({
            key: "arrow",
            frames: [{ key: "arrow", frame: 0 }],
            frameRate: 30,
            repeat: 0,
        });

        createFireAnimations(anims);

        // --- Collectable animations ---

        createCoinAnimations(anims);

        initializedManagers.add(anims);
    }
};
