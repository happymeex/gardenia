import Phaser from "phaser";
import { CANVAS_CENTER, CANVAS_WIDTH } from "../constants";
import { paragraphTextStyleBase } from "../ui";
import {
    fadeToNextScene,
    loadAudio,
    loadImages,
    loadSettingsIcon,
    loadSprites,
} from "../utils";

class Landing extends Phaser.Scene {
    private centerText = { destroy() {} };
    constructor() {
        super({ key: "landing" });
    }
    preload() {
        this.centerText = this.add
            .text(...CANVAS_CENTER, "Loading...", paragraphTextStyleBase)
            .setOrigin(0.5);
        loadAudio(this);
        loadImages(this);
        loadSprites(this);
        loadSettingsIcon(this);
        this.load.on("complete", () => {
            this.centerText.destroy();
            const clickToBegin = this.add
                .text(
                    ...CANVAS_CENTER,
                    "Click anywhere to begin",
                    paragraphTextStyleBase
                )
                .setOrigin(0.5);

            this.tweens.add({
                targets: clickToBegin,
                yoyo: true,
                duration: 1300,
                alpha: 0,
                repeat: -1,
            });
            this.input.on("pointerup", () => {
                fadeToNextScene(this, "main-menu");
            });
        });
    }
    create() {}
}

export default Landing;
