export default (anims) => {
    anims.create({
        key: "fire",
        frames: anims.generateFrameNumbers("fire-animation", {
            start: 0,
            end: 7,
        }),
        frameRate: 16,
        repeat: -1,
    });
};
