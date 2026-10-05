import * as Phaser from "phaser/dist/phaser.esm.js";
import BaseScene from "../BaseScene";

export default class SettingsScene extends BaseScene {
    currentMusicBars: number;
    maxVolumeBars: number;
    minVolumeBars: number;
    volumeBars: Phaser.GameObjects.Image[];
    inputBlock: Phaser.GameObjects.Rectangle;
    muteBtn: Phaser.GameObjects.Image;
    muteStateImage: Phaser.GameObjects.Image;

    constructor(config: any) {
        super("SettingsScene", { ...config, canGoBack: false });
        this.volumeBars = [];
    }

    init() {
        this.currentMusicBars = Math.ceil(this.sound.volume * 10);
        this.maxVolumeBars = 10;
        this.minVolumeBars = 0;
    }

    create() {
        super.create();

        this.createInputBlock(); // Prevents click events behind the overlay from happening

        this.setupUI();

        this.createMusicController();
        this.createMuteButton();
        this.createMusicBars();
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
            .image(
                this.config.width / 2,
                this.config.height / 2 - 50,
                "panel-4"
            )
            .setOrigin(0.5)
            .setScale(1.3, 0.75);

        // this.add
        //     .image(
        //         this.config.width / 2,
        //         this.config.height / 2 + 50,
        //         "panel-4"
        //     )
        //     .setOrigin(0.5)
        //     .setScale(1.3, 0.5);

        this.add
            .image(
                this.config.width / 2,
                this.config.height / 2 + 100,
                "panel-4"
            )
            .setOrigin(0.5)
            .setScale(0.75, 0.75);

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
            .text(this.config.width / 2, this.config.height / 6, "SETTINGS", {
                fontFamily: "customFont",
                fontSize: "72px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("#D9B48FFF");

        this.add
            .image(
                this.config.width / 3 + 50,
                this.config.height / 2 - 50,
                "music-btn-on"
            )
            .setOrigin(0.5)
            .setScale(0.8);

        // this.add
        //     .image(
        //         this.config.width / 3 + 50,
        //         this.config.height / 2 + 50,
        //         "sound-btn-on"
        //     )
        //     .setOrigin(0.5)
        //     .setScale(0.8);

        this.add
            .image(
                this.config.width / 2 - 75,
                this.config.height / 2 + 100,
                "mute-btn-on"
            )
            .setOrigin(0.5)
            .setScale(0.8);

        this.createCloseButton();
    }

    createCloseButton() {
        this.createButton(
            this.config.width * 0.75 + 20,
            this.config.height / 7 + 20,
            "close-btn",
            () => {
                this.selectFx.play();
                this.scene.stop("SettingsScene");
                if (this.scene.isPaused("PlayScene")) {
                    this.scene.resume("PlayScene");
                }
            }
        );
    }

    createMuteButton() {
        this.createButton(
            this.config.width / 2 + 50,
            this.config.height / 2 + 100,
            "switch-off-bg",
            () => {
                this.selectFx.play();
                this.toggleMute();
                this.game.canvas.classList.add("custom-cursor");
            }
        ).setScale(1.3, 0.9);

        this.updateMuteStateImage();
    }

    updateMuteStateImage() {
        if (this.muteStateImage) {
            this.muteStateImage.destroy();
        }

        const imageKey = this.sound.mute ? "switch-off" : "switch-on";
        if (imageKey === "switch-off") {
            this.muteStateImage = this.add
                .image(
                    this.config.width / 2,
                    this.config.height / 2 + 100,
                    imageKey
                )
                .setOrigin(0.5)
                .setScale(0.8)
                .setDepth(3);
        } else {
            this.muteStateImage = this.add
                .image(
                    this.config.width / 2 + 100,
                    this.config.height / 2 + 100,
                    imageKey
                )
                .setOrigin(0.5)
                .setScale(0.8)
                .setDepth(3);
        }
    }

    createMusicController() {
        this.createIncrementBtn(
            this.config.width / 2 + 200,
            this.config.height / 2 - 50
        );
        this.createDecrementBtn(
            this.config.width / 2 - 100,
            this.config.height / 2 - 50
        );
    }

    createDecrementBtn(width: number, height: number) {
        this.createButton(width, height, "prev-btn", () => {
            this.selectFx.play();
            this.decreaseVolume();
            this.game.canvas.classList.add("custom-cursor");
        }).setScale(0.75);
    }

    createIncrementBtn(width: number, height: number) {
        this.createButton(width, height, "next-btn", () => {
            this.selectFx.play();
            this.increaseVolume();
            this.game.canvas.classList.add("custom-cursor");
        }).setScale(0.75);
    }

    // Volume bar creation
    createMusicBars() {
        // Clear existing bars
        this.volumeBars.forEach((bar) => bar.destroy());
        this.volumeBars = [];

        const barWidth = 25;
        let width = this.config.width / 2 - 65;
        let height = this.config.height / 2 - 50;
        for (let i = 0; i < this.currentMusicBars; i++) {
            this.volumeBars.push(this.createVolumeBar(width, height));
            width += barWidth;
        }
    }

    createVolumeBar(width: number, height: number) {
        return this.add
            .image(width, height, "yellow-bar")
            .setOrigin(0.5)
            .setScale(0.9);
    }

    // Volume control methods
    increaseVolume() {
        if (this.currentMusicBars < this.maxVolumeBars) {
            this.currentMusicBars += 1;
            this.sound.volume = Phaser.Math.Clamp(
                this.sound.volume + 0.1,
                0,
                1
            );
            localStorage.setItem("hoodedHero.music", String(Math.round(this.sound.volume * 100)));
            localStorage.setItem("hoodedHero.sfx", String(Math.round(this.sound.volume * 100)));
            this.createMusicBars();
        }
    }

    decreaseVolume() {
        if (this.currentMusicBars > this.minVolumeBars) {
            this.currentMusicBars -= 1;
            this.sound.volume = Phaser.Math.Clamp(
                this.sound.volume - 0.1,
                0,
                1
            );
            localStorage.setItem("hoodedHero.music", String(Math.round(this.sound.volume * 100)));
            localStorage.setItem("hoodedHero.sfx", String(Math.round(this.sound.volume * 100)));
            this.createMusicBars();
        }
    }

    toggleMute() {
        this.sound.mute = !this.sound.mute;
        localStorage.setItem("hoodedHero.muted", String(this.sound.mute));
        this.updateMuteStateImage();
    }
}
