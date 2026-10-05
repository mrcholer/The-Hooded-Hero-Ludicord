// @ts-nocheck

import BaseScene from "./BaseScene";

interface Menu {
    scene: string;
    text: string;
    level?: number;
}

class LevelSelect extends BaseScene {
    menu: Menu[];

    constructor(config: any) {
        super("LevelSelect", { ...config, canGoBack: true });
        this.screenCenter = [config.width / 2, config.height / 4 + 100];
        this.lineHeight = 100;
    }

    create() {
        super.create();
        super.createBackground();

        this.menu = [];

        this.setupUI();
        this.createLevelSelections();

        this.createMenu(this.menu, this.setupMenuEvents.bind(this));
    }

    setupUI() {
        this.add
            .image(this.config.width / 2, this.config.height / 2, "panel-3")
            .setOrigin(0.5)
            .setScale(1.4);

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
            .text(this.config.width / 2, this.config.height / 6, "LEVELS", {
                fontFamily: "customFont",
                fontSize: "72px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("#D9B48FFF");

        this.createCloseButton();
    }

    createLevelSelections() {
        const levels = this.registry.get("unlocked-levels");

        let row = 100;
        for (let i = 1; i <= 3; i++) {
            this.add
                .image(
                    this.config.width / 2 + 20,
                    this.config.height / 4 + row,
                    "panel-4"
                )
                .setOrigin(0.5)
                .setScale(1, 0.5);

            this.add
                .image(
                    this.config.width / 3,
                    this.config.height / 4 + row,
                    "stage-icon"
                )
                .setOrigin(0.5)
                .setScale(0.5);

            this.add
                .text(
                    this.config.width / 3,
                    this.config.height / 4 + row,
                    `${i}`,
                    {
                        fontFamily: "customFont",
                        fontSize: "50px",
                    }
                )
                .setOrigin(0.5)
                .setColor("#000000");

            row += 100;

            this.menu.push({
                scene: "PlayScene",
                text: `Level ${i}`,
                level: i,
            });
        }
    }

    createCloseButton() {
        const closeBtn = this.add
            .image(
                this.config.width * 0.8,
                this.config.height / 7 + 30,
                "close-btn"
            )
            .setName("close-btn")
            .setOrigin(0.5)
            .setScale(0.7)
            .setInteractive()
            .setDepth(2);

        closeBtn.on("pointerup", () => {
            this.selectFx.play();
            window.dispatchEvent(new Event("hoodedhero:menu"));
            this.scene.stop("LevelSelect");
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

    setupMenuEvents(menuItem: Menu) {
        const textGO = menuItem.textGO;
        textGO.setInteractive();

        textGO.on("pointerup", () => {
            this.game.canvas.classList.remove("custom-cursor");
            this.cameras.main.fadeOut(500, 0, 0, 0);

            if (menuItem.scene) {
                this.fluteFx.play();
                this.registry.set("level", menuItem.level);
                this.time.delayedCall(500, () => this.scene.start(menuItem.scene, { gameStatus: "NEW_GAME" }));
            }
        });

        textGO.on("pointerover", () => {
            this.cursorOverFx.play();
            textGO.setStyle({ fill: "#fff" });
            this.game.canvas.classList.add("custom-cursor");
        });

        textGO.on("pointerout", () => {
            textGO.setStyle({ fill: "#000" });
            this.game.canvas.classList.remove("custom-cursor");
        });
    }
}

export default LevelSelect;
