import { addGameSound } from "@/lib/game-audio";

import BaseScene from "../BaseScene";

class VictoryScene extends BaseScene {
    victory: any;
    score: number;
    scoreText: any;

    constructor(config: any) {
        super("VictoryScene", config);
    }

    init(data: any) {
        console.log({ Data: data.score });
        this.score = data.score; // Store the score
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        super.create();

        this.victory = addGameSound(this, "win", { volume: 0.1 }).play();

        this.setupUI();
    }

    setupUI() {
        this.add
            .image(this.config.width / 2, this.config.height / 2, "panel-1")
            .setOrigin(0.5)
            .setScale(1, 0.7);

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

        // Empty Stars

        this.add
            .image(
                this.config.width / 2 - 130,
                this.config.height / 2 - 75,
                "star-shadow"
            )
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .image(
                this.config.width / 2,
                this.config.height / 2 - 100,
                "star-shadow"
            )
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .image(
                this.config.width / 2 + 130,
                this.config.height / 2 - 75,
                "star-shadow"
            )
            .setOrigin(0.5)
            .setScale(0.7);

        // Add empty stars
        this.addStar(
            this.config.width / 2 - 130,
            this.config.height / 2 - 75,
            0,
            0.7
        );
        this.addStar(
            this.config.width / 2,
            this.config.height / 2 - 100,
            5,
            0.7
        );
        this.addStar(
            this.config.width / 2 + 130,
            this.config.height / 2 - 75,
            10,
            0.7
        );

        this.add
            .image(
                this.config.width / 2,
                this.config.height / 2 + 50,
                "panel-4"
            )
            .setOrigin(0.5)
            .setScale(0.5);

        this.add
            .image(
                this.config.width / 2 - 50,
                this.config.height / 2 + 50,
                "coin"
            )
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .text(this.config.width / 2, this.config.height / 6, "You Win!", {
                fontFamily: "customFont",
                fontSize: "60px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("#D9B48FFF");

        // Create a text object to display the score
        this.scoreText = this.add
            .text(
                this.config.width / 2 + 50,
                this.config.height / 2 + 50,
                `0`,
                {
                    fontFamily: "customFont",
                    fontSize: "50px",
                }
            )
            .setOrigin(0.5, 0.5)
            .setColor("#FFFFFF");

        this.animateScore();

        this.createHomeButton();
        this.createRestartButton();
        this.createPlayButton();
    }

    addStar(x: number, y: number, requiredScore: number, scale: number) {
        const starKey = this.score >= requiredScore && "star-full";

        if (!starKey) return;

        const star = this.add.image(x, y, starKey).setOrigin(0.5).setAlpha(0);

        // Animate the star's appearance
        this.tweens.add({
            targets: star,
            scale: scale,
            alpha: 1,
            ease: "Bounce.out",
            duration: 500,
            delay: requiredScore * 100, // Delay based on the required score to make them appear one by one
        });
    }

    animateScore() {
        let currentScore = 0;
        const scoreIncrement = this.score / 100; // Number of increments to reach the final score

        this.tweens.addCounter({
            from: 0,
            to: this.score,
            duration: 500, // Adjust duration as needed
            onUpdate: (tween) => {
                currentScore = Math.floor(tween.getValue() ?? 0);
                this.scoreText.setText(`${currentScore}`);
            },
            onComplete: () => {
                this.scoreText.setText(`${this.score}`); // Ensure final score is displayed
            },
        });
    }

    createHomeButton() {
        this.createButton(
            this.config.width / 2 - 150,
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
            this.config.width / 2,
            this.config.height / 2 + 150,
            "restart-btn-big",
            () => {
                this.scene.stop("VictoryScene");
                this.scene.start("PlayScene", { gameStatus: "NEW_GAME" });
            }
        );
    }

    createPlayButton() {
        this.createButton(
            this.config.width / 2 + 150,
            this.config.height / 2 + 150,
            "play-btn",
            () => {
                if (this.registry.get("level") === this.config.lastLevel) {
                    this.scene.stop("VictoryScene");
                    this.scene.start("CreditsScene");
                    this.scene.stop("PlayScene");
                } else {
                    this.scene.stop("VictoryScene");
                    this.registry.inc("level", 1);
                    this.registry.inc("unlocked-levels", 1);
                    this.scene.start("PlayScene", { gameStatus: "NEW_GAME" });
                }
            }
        );
    }
}

export default VictoryScene;
