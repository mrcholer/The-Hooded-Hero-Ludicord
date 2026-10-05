import type * as Phaser from "phaser";
import BaseScene from "../BaseScene";

class Controls extends BaseScene {
    inputBlock: Phaser.GameObjects.Rectangle;

    constructor(config: any) {
        super("Controls", { ...config, canGoBack: true });
    }

    create() {
        super.create();
        this.createInputBlock();

        this.setupUI();
    }

    createInputBlock() {
        this.inputBlock = this.add
            .rectangle(
                this.config.width / 2,
                this.config.height / 2,
                this.config.width,
                this.config.height,
                0x000000,
                50
            )
            .setOrigin(0.5)
            .setInteractive()
            .setDepth(-1);

        this.inputBlock.on(
            "pointerdown",
            (pointer: any, localX: number, localY: number, event: any) => {
                event.stopPropagation();
            }
        );
    }

    setupUI() {
        this.add
            .image(this.config.width / 2, this.config.height / 2, "panel-2")
            .setOrigin(0.5)
            .setScale(0.7);

        this.add
            .image(this.config.width / 3 - 20, 240, "left-key")
            .setOrigin(0.5)
            .setScale(0.5);

        this.add
            .image(this.config.width / 3 + 80, 240, "right-key")
            .setOrigin(0.5)
            .setScale(0.5);

        this.add
            .text(this.config.width / 3 - 20, 330, "R", { fontFamily: "customFont", fontSize: "60px", color: "#000000" })
            .setOrigin(0.5)
            .setScale(1);

        this.add
            .image(this.config.width / 3 + 80, 330, "e-key")
            .setOrigin(0.5)
            .setScale(0.5);
        this.add
            .image(this.config.width / 3 + 35, 420, "space-key")
            .setOrigin(0.5)
            .setScale(0.5);
        this.add
            .image(this.config.width / 3 + 40, 510, "shift-key")
            .setOrigin(0.5)
            .setScale(0.5);

        this.add
            .image(
                this.config.width / 2,
                this.config.height / 6,
                "header-shadow"
            )
            .setOrigin(0.5)
            .setScale(0.9);

        this.add
            .image(this.config.width / 2, this.config.height / 6, "header")
            .setOrigin(0.5)
            .setScale(0.9);

        this.add
            .text(this.config.width / 2, this.config.height / 6, "CONTROLS", {
                fontFamily: "customFont",
                fontSize: "72px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("#D9B48FFF");

        this.add
            .text(this.config.width / 1.75, 240, "Move Left/Right", {
                fontFamily: "customFont",
                fontSize: "40px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("0x000");

        this.add
            .text(
                this.config.width / 1.75 + 20,
                330,
                "Bow / Sword",
                {
                    fontFamily: "customFont",
                    fontSize: "40px",
                }
            )
            .setOrigin(0.5, 0.5)
            .setColor("0x000");

        this.add
            .text(this.config.width / 1.75, 420, "Jump/Double Jump", {
                fontFamily: "customFont",
                fontSize: "40px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("0x000");
        this.add
            .text(this.config.width / 1.75, 510, "Hold to run", {
                fontFamily: "customFont",
                fontSize: "40px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("0x000");

        this.createCloseButton();
        this.add.text(this.config.width / 2, 190, "Q/A/← · D/→ move    Z/W/↑/Space jump", { fontFamily: "customFont", fontSize: "25px", color: "#000000" }).setOrigin(0.5);
        this.add.text(this.config.width / 2, 580, "Controller: stick / D-pad · A/✕ jump · RB/R1 run · B/○ bow · X/□ sword", { fontFamily: "customFont", fontSize: "23px", color: "#000000" }).setOrigin(0.5);
    }

    createCloseButton() {
        const closeBtn = this.add
            .image(
                this.config.width * 0.75 + 20,
                this.config.height / 7 + 20,
                "close-btn"
            )
            .setName("close-btn")
            .setOrigin(0.5)
            .setScale(0.7)
            .setInteractive()
            .setDepth(2);

        closeBtn.on("pointerup", () => {
            this.selectFx.play();
            // this.scene.wake("MainMenu");
            this.scene.stop("Controls");
            if (this.scene.isPaused("PlayScene")) {
                this.scene.resume("PlayScene");
            }
            this.game.canvas.classList.remove("custom-cursor");
        });

        closeBtn.on("pointerover", () => {
            this.cursorOverFx.play();
            closeBtn.setTint(0xff6666);
            this.game.canvas.classList.add("custom-cursor");
        });

        closeBtn.on("pointerout", () => {
            closeBtn.clearTint();
            this.game.canvas.classList.remove("custom-cursor");
        });
    }
}

export default Controls;
