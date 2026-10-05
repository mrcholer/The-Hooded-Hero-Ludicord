const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "shield-run",
            frames: anims.generateFrameNumbers("shield-run", {
                start: 0,
                end: 6,
            }),
            frameRate: 12,
            repeat: -1,
        });

        anims.create({
            key: "shield-attack",
            frames: anims.generateFrameNumbers("shield-attack", {
                start: 0,
                end: 6,
            }),
            frameRate: 6,
            repeat: 0,
        });

        anims.create({
            key: "shield-die",
            frames: anims.generateFrameNumbers("shield-death", {
                start: 0,
                end: 6,
            }),
            frameRate: 14,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
