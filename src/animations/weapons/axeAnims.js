export default (anims) => {
    anims.create({
        key: "axe-default-swing",
        frames: anims.generateFrameNumbers("boss-default", {
            start: 0,
            end: 18,
        }),
        frameRate: 20,
        repeat: 0,
    });
};
