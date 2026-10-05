const initializedManagers = new WeakSet();

export default (anims) => {
    if (!initializedManagers.has(anims)) {
        anims.create({
            key: `idle-player-1`,
            frames: anims.generateFrameNumbers("player-1", {
                start: 0,
                end: 8,
            }),
            frameRate: 18,
            repeat: -1,
        });

        anims.create({
            key: `run-player-1`,
            frames: anims.generateFrameNumbers("player-1", {
                start: 9,
                end: 17,
            }),
            frameRate: 20,
            repeat: -1,
        });

        anims.create({
            key: `jump-player-1`,
            frames: anims.generateFrameNumbers("player-1", {
                start: 18,
                end: 19,
            }),
            frameRate: 1.5,
            repeat: -1,
        });

        anims.create({
            key: `idle-player-2`,
            frames: anims.generateFrameNumbers("player-2", {
                start: 0,
                end: 8,
            }),
            frameRate: 18,
            repeat: -1,
        });

        anims.create({
            key: `run-player-2`,
            frames: anims.generateFrameNumbers("player-2", {
                start: 9,
                end: 17,
            }),
            frameRate: 20,
            repeat: -1,
        });

        anims.create({
            key: `jump-player-2`,
            frames: anims.generateFrameNumbers("player-2", {
                start: 18,
                end: 19,
            }),
            frameRate: 1.5,
            repeat: -1,
        });

        anims.create({
            key: `idle-player-3`,
            frames: anims.generateFrameNumbers("player-3", {
                start: 0,
                end: 8,
            }),
            frameRate: 18,
            repeat: -1,
        });

        anims.create({
            key: `run-player-3`,
            frames: anims.generateFrameNumbers("player-3", {
                start: 9,
                end: 17,
            }),
            frameRate: 20,
            repeat: -1,
        });

        anims.create({
            key: `jump-player-3`,
            frames: anims.generateFrameNumbers("player-3", {
                start: 18,
                end: 19,
            }),
            frameRate: 1.5,
            repeat: -1,
        });

        anims.create({
            key: `idle-player-4`,
            frames: anims.generateFrameNumbers("player-4", {
                start: 0,
                end: 8,
            }),
            frameRate: 18,
            repeat: -1,
        });

        anims.create({
            key: `run-player-4`,
            frames: anims.generateFrameNumbers("player-4", {
                start: 9,
                end: 17,
            }),
            frameRate: 20,
            repeat: -1,
        });

        anims.create({
            key: `jump-player-4`,
            frames: anims.generateFrameNumbers("player-4", {
                start: 18,
                end: 19,
            }),
            frameRate: 1.5,
            repeat: -1,
        });

        initializedManagers.add(anims);
    }
};
