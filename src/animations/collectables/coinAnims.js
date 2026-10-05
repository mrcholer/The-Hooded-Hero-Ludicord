export default (anims) => {
    anims.create({
        key: "coin-spin",
        frames: anims.generateFrameNumbers("coin-spin", { start: 0, end: 7 }),
        frameRate: 16,
        repeat: -1,
    });
};
