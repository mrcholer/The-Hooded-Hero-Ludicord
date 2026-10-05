const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "bee-fly",
            frames: anims.generateFrameNumbers("bee", { start: 0, end: 8 }),
            frameRate: 16,
            repeat: -1,
        });

        anims.create({
            key: "bee-attack",
            frames: anims.generateFrameNumbers("bee-attack", {
                start: 0,
                end: 5,
            }),
            frameRate: 10,
            repeat: 0,
        });

        anims.create({
            key: "bee-die",
            frames: anims.generateFrameNumbers("bee-death", {
                start: 0,
                end: 8,
            }),
            frameRate: 16,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
