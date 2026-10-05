const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: "skeleton-run",
            frames: anims.generateFrameNumbers("skeleton", {
                start: 0,
                end: 10,
            }),
            frameRate: 15,
            repeat: -1,
        });

        anims.create({
            key: "skeleton-attack",
            frames: anims.generateFrameNumbers("skeleton-attack", {
                start: 0,
                end: 6,
            }),
            frameRate: 12,
            repeat: 0,
        });

        anims.create({
            key: "skeleton-die",
            frames: anims.generateFrameNumbers("skeleton-death", {
                start: 0,
                end: 5,
            }),
            frameRate: 12,
            repeat: 0,
        });

        initializedManagers.add(anims);
    }
};
