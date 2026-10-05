import BaseScene from "../BaseScene";

export default class Contact extends BaseScene {
    constructor(config: any) {
        super("Contact", { ...config, canGoBack: true });
    }

    create() {
        super.create();
        super.createBackground();

        this.setupUI();
    }

    openLink(url: string) {
        const newWindow = window.open(url, "_blank");
        if (newWindow && newWindow.focus) newWindow.focus();
        else if (!newWindow) {
            window.location.href = url;
        }
    }

    setupUI() {
        this.add
            .image(this.config.width / 2, this.config.height / 2, "panel-2")
            .setOrigin(0.5)
            .setScale(1, 0.7);

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
            .text(this.config.width / 2, this.config.height / 6, "CONTACT", {
                fontFamily: "customFont",
                fontSize: "72px",
            })
            .setOrigin(0.5, 0.5)
            .setColor("#D9B48FFF");

        this.add
            .text(this.config.width / 3, 250, "https://github.com/Tandid", {
                fontFamily: "customFont",
                fontSize: "40px",
            })
            .setOrigin(0, 0.5)
            .setColor("0x000");

        this.add
            .text(
                this.config.width / 3,
                350,
                "https://www.linkedin.com/in/tandidalam/",
                {
                    fontFamily: "customFont",
                    fontSize: "40px",
                }
            )
            .setOrigin(0, 0.5)
            .setColor("0x000");

        this.add
            .text(this.config.width / 3, 450, "tandid.alam@gmail.com", {
                fontFamily: "customFont",
                fontSize: "40px",
            })
            .setOrigin(0, 0.5)
            .setColor("0x000");

        this.createCloseButton();
        this.createGithubButton();
        this.createLinkedInButton();
        this.createEmailButton();
    }

    createCloseButton() {
        const closeBtn = this.add
            .image(
                this.config.width / 1.1 - 20,
                this.config.height / 7 + 20,
                "close-btn"
            )
            .setOrigin(0.5)
            .setScale(0.7)
            .setInteractive()
            .setDepth(2);

        closeBtn.on("pointerup", () => {
            this.selectFx.play();
            this.scene.wake("MainMenu");
            this.scene.stop("Contact");
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

    createGithubButton() {
        const githubBtn = this.add
            .image(this.config.width / 4, 250, "github")
            .setOrigin(0.5)
            .setScale(0.15)
            .setDepth(2)
            .setInteractive();

        githubBtn.on("pointerup", () => {
            this.openLink("https://github.com/tandid"), this;
            this.game.canvas.classList.remove("custom-cursor");
        });

        githubBtn.on("pointerover", () => {
            this.cursorOverFx.play();
            githubBtn.setScale(0.17);
            this.game.canvas.classList.add("custom-cursor");
        });

        githubBtn.on("pointerout", () => {
            githubBtn.setScale(0.15);
            this.game.canvas.classList.remove("custom-cursor");
        });
    }

    createLinkedInButton() {
        const linkedinBtn = this.add
            .image(this.config.width / 4, 350, "linkedin")
            .setOrigin(0.5)
            .setScale(0.15)
            .setDepth(2)
            .setInteractive();

        linkedinBtn.on("pointerup", () => {
            this.openLink("https://www.linkedin.com/in/tandidalam/"), this;
            this.game.canvas.classList.remove("custom-cursor");
        });

        linkedinBtn.on("pointerover", () => {
            this.cursorOverFx.play();
            linkedinBtn.setScale(0.17);
            this.game.canvas.classList.add("custom-cursor");
        });

        linkedinBtn.on("pointerout", () => {
            linkedinBtn.setScale(0.15);
            this.game.canvas.classList.remove("custom-cursor");
        });
    }

    createEmailButton() {
        const emailBtn = this.add
            .image(this.config.width / 4, 450, "gmail")
            .setOrigin(0.5)
            .setScale(0.15)
            .setDepth(2)
            .setInteractive();

        emailBtn.on("pointerup", () => {
            this.openLink("https://www.tandidalam.com/"), this;
            this.game.canvas.classList.remove("custom-cursor");
        });

        emailBtn.on("pointerover", () => {
            this.cursorOverFx.play();
            emailBtn.setScale(0.17);
            this.game.canvas.classList.add("custom-cursor");
        });

        emailBtn.on("pointerout", () => {
            emailBtn.setScale(0.15);
            this.game.canvas.classList.remove("custom-cursor");
        });
    }
}
