import { addGameSound } from "@/lib/game-audio";

import BaseScene from "../BaseScene";

class GameOverScene extends BaseScene {
    gameOver: any;

    constructor(config: any) {
        super("GameOverScene", config);
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        super.create();

        this.gameOver = addGameSound(this, "lose", { volume: 0.1 }).play();

        this.setupUI();
    }

    setupUI() {
        this.add
            .image(this.config.width / 2, this.config.height / 2, "panel-1")
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .image(
                this.config.width / 2,
                this.config.height / 6,
                "header-shadow"
            )
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .image(this.config.width / 2, this.config.height / 6, "header")
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .image(this.config.width / 2, this.config.height / 2 - 50, "skull")
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .text(this.config.width / 2, this.config.height / 6, "DEFEAT!", {
                fontFamily: "customFont",
                fontSize: "60px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("#D9B48FFF");

        this.createHomeButton();
        this.createRestartButton();
    }

    createHomeButton() {
        this.createButton(
            this.config.width / 2 - 75,
            this.config.height / 2 + 150,
            "home-btn-big",
            () => {
                this.scene.stop("PlayScene");
                window.dispatchEvent(new Event("hoodedhero:menu"));
            }
        );
    }

    createRestartButton() {
        this.createButton(
            this.config.width / 2 + 75,
            this.config.height / 2 + 150,
            "restart-btn-big",
            () => {
                this.scene.stop("GameOverScene");
                this.scene.start("PlayScene", { gameStatus: "NEW_GAME" });
            }
        );
    }
}

export default GameOverScene;
