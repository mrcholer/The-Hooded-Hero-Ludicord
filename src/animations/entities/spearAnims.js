const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "spear-run",
            frames: anims.generateFrameNumbers("spear-run", {
                start: 0,
                end: 9,
            }),
            frameRate: 10,
            repeat: -1,
        });

        anims.create({
            key: "spear-attack",
            frames: anims.generateFrameNumbers("spear-attack", {
                start: 0,
                end: 12,
            }),
            frameRate: 13,
            repeat: 0,
        });

        anims.create({
            key: "spear-die",
            frames: anims.generateFrameNumbers("spear-death", {
                start: 0,
                end: 6,
            }),
            frameRate: 14,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
