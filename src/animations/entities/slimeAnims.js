const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "slime-run",
            frames: anims.generateFrameNumbers("slime", { start: 0, end: 11 }),
            frameRate: 15,
            repeat: -1,
        });

        anims.create({
            key: "slime-die",
            frames: anims.generateFrameNumbers("slime-death", {
                start: 0,
                end: 12,
            }),
            frameRate: 20,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
