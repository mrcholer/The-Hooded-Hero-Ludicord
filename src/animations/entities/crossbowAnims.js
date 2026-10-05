const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "crossbow-attack",
            frames: anims.generateFrameNumbers("crossbow-attack", {
                start: 0,
                end: 6,
            }),
            frameRate: 14,
            repeat: 0,
        });

        anims.create({
            key: "crossbow-die",
            frames: anims.generateFrameNumbers("crossbow-death", {
                start: 0,
                end: 8,
            }),
            frameRate: 18,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
