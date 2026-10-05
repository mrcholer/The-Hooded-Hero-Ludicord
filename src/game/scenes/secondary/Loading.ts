// @ts-nocheck

import * as Phaser from "phaser/dist/phaser.esm.js";
import { generateRandomHint } from "../../../utils/helpers";

class Loading extends Phaser.Scene {
    config: any;
    fontFamily: string;
    playerStart: number;
    acceleration: number;
    num: number;

    constructor(config: any) {
        super("Loading");
        this.config = config;
        this.fontFamily = "customFont";
        this.playerStart = this.config.width / 10;
        this.acceleration = 120;
        this.num = 48;
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        setTimeout(() => this.cameras.main.fadeOut(500, 0, 0, 0), 2000);

        this.add
            .text(
                this.config.width / 2,
                this.config.height / 2,
                `Loading ...`,
                {
                    fontFamily: "customFont",
                    fontSize: "72px",
                    fontWeight: "larger",
                }
            )
            .setOrigin(0.5, 0.5)
            .setColor("#FFF");

        const player = this.add
            .image(
                this.config.width / 1.1 + 50,
                this.config.height / 1.1,
                "player-icon"
            )
            .setScale(0.5)
            .setDepth(-1);

        this.tweens.add({
            targets: player,
            scale: { from: 0.5, to: 0.6 },
            repeat: -1,
            yoyo: true,
        });

        generateRandomHint(this, this.config.width, this.config.height);
    }
}

export default Loading;
