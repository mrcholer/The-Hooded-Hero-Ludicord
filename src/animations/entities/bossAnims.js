const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "boss-run",
            frames: anims.generateFrameNumbers("boss", { start: 0, end: 10 }),
            frameRate: 20,
            repeat: -1,
        });

        anims.create({
            key: "boss-melee",
            frames: anims.generateFrameNumbers("boss-default", {
                start: 0,
                end: 18,
            }),
            frameRate: 18,
            repeat: 0,
        });

        anims.create({
            key: "boss-die",
            frames: anims.generateFrameNumbers("boss-death", {
                start: 0,
                end: 10,
            }),
            frameRate: 11,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
