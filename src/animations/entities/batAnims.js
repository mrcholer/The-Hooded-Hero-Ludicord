const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "bat-idle",
            frames: anims.generateFrameNumbers("bat-idle", {
                start: 0,
                end: 7,
            }),
            frameRate: 16,
            repeat: -1,
        });

        anims.create({
            key: "bat-fly",
            frames: anims.generateFrameNumbers("bat-fly", { start: 0, end: 6 }),
            frameRate: 14,
            repeat: -1,
        });

        anims.create({
            key: "bat-attack",
            frames: anims.generateFrameNumbers("bat-attack", {
                start: 0,
                end: 7,
            }),
            frameRate: 16,
            repeat: 0,
        });

        anims.create({
            key: "bat-die",
            frames: anims.generateFrameNumbers("bat-death", {
                start: 0,
                end: 7,
            }),
            frameRate: 16,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
