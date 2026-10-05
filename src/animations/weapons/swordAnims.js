export default (anims) => {
    anims.create({
        key: "sword-default-swing",
        frames: anims.generateFrameNumbers("sword-default", {
            start: 0,
            end: 6,
        }),
        frameRate: 60,
        repeat: 0,
    });
};
