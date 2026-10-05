const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "idle",
            frames: anims.generateFrameNumbers("player", { start: 0, end: 8 }),
            frameRate: 18,
            repeat: -1,
        });

        anims.create({
            key: "run",
            frames: anims.generateFrameNumbers("player", { start: 9, end: 17 }),
            frameRate: 30,
            repeat: -1,
        });

        anims.create({
            key: "jump",
            frames: anims.generateFrameNumbers("player", {
                start: 18,
                end: 19,
            }),
            frameRate: 1,
            repeat: 0,
        });

        anims.create({
            key: "shoot-arrow",
            frames: anims.generateFrameNumbers("player-shoot-arrow", {
                start: 0,
                end: 14,
            }),
            frameRate: 60,
            repeat: 0,
        });

        anims.create({
            key: "melee",
            frames: anims.generateFrameNumbers("player-melee", {
                start: 0,
                end: 6,
            }),
            frameRate: 30,
            repeat: 0,
        });

        anims.create({
            key: "player-die",
            frames: anims.generateFrameNumbers("player-death", {
                start: 0,
                end: 8,
            }),
            frameRate: 16,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
