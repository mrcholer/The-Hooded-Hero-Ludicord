const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "spider-run",
            frames: anims.generateFrameNumbers("spider", { start: 0, end: 10 }),
            frameRate: 20,
            repeat: -1,
        });
        anims.create({
            key: "spider-attack",
            frames: anims.generateFrameNumbers("spider-attack", {
                start: 0,
                end: 5,
            }),
            frameRate: 10,
            repeat: 0,
        });

        anims.create({
            key: "spider-die",
            frames: anims.generateFrameNumbers("spider-death", {
                start: 0,
                end: 9,
            }),
            frameRate: 18,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
