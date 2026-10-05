import * as Phaser from "phaser/dist/phaser.esm.js";

class HealthBar {
    constructor(scene, x, y, scale = 1, health) {
        this.scene = scene;
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x / scale;
        this.y = y / scale;
        this.scale = scale;
        this.value = health;

        this.size = {
            width: 200,
            height: 20,
        };

        this.pixelPerHealth = this.size.width / this.value;

        scene.add.existing(this.bar);

        this.healthText = this.scene.add
            .text(this.x, this.y, `${health}`, {
                fontSize: `32px`,
                color: "#000",
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1);

        this.draw(this.x, this.y, this.scale);
    }

    decrease(amount) {
        if (amount <= 0) {
            this.value = 0;
        } else {
            this.value = amount;
        }

        this.draw(this.x, this.y, this.scale);
    }

    draw(x, y, scale) {
        this.bar.clear();
        const { width, height } = this.size;

        const margin = 3;

        this.bar.fillStyle(0x000);
        this.bar.fillRect(x, y, width + margin * 2, height + margin * 2);

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(
            x + margin,
            y + margin,
            width - margin,
            height - margin
        );

        const healthWidth = Math.floor(this.pixelPerHealth * this.value);

        if (healthWidth <= this.size.width / 3) {
            this.bar.fillStyle(0xff0000);
        } else {
            this.bar.fillStyle(0x228b22);
        }

        if (healthWidth > 0) {
            this.bar.fillRect(
                x + margin,
                y + margin,
                healthWidth - margin,
                height - margin
            );
        }

        // Update the health text position and value
        this.healthText.setText(`${this.value}/100`);
        this.healthText.setPosition(x - 150, y - 140);

        return this.bar.setScrollFactor(0, 0).setScale(scale);
    }

    destroy() {
        // Destroy the bar and text objects
        this.bar.destroy();
        this.healthText.destroy();
    }
}

export default HealthBar;
