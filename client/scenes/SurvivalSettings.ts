import Phaser from "phaser";
import { CANVAS_CENTER, DEFAULT_FADE_TIME } from "../constants";
import {
    menuTextStyleBase,
    paragraphTextStyleBase,
    makeClickable,
} from "../ui";
import { fadeMusic, fadeToNextScene } from "../utils";

class SurvivalSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "survival-settings" });
    }
    create() {
        const container = this.add.container(...CANVAS_CENTER);
        const header = this.add.text(0, -250, "Survival", {
            ...menuTextStyleBase,
            fontSize: "72px",
        });
        const subHeader = this.add.text(
            0,
            -200,
            "Test yourself against hordes of bots!",
            paragraphTextStyleBase
        );
        const returnToHome = this.add.text(
            -400,
            -250,
            "\u2039 Back",
            menuTextStyleBase
        );
        const begin = this.add.text(0, 200, "Begin", menuTextStyleBase);
        makeClickable(returnToHome, this, () => {
            this.scene.start("main-menu");
        });
        makeClickable(begin, this, () => {
            fadeMusic(this);
            fadeToNextScene(this, "survival");
        });
        container.add(
            [header, subHeader, returnToHome, begin].map((item) =>
                item.setOrigin(0.5)
            )
        );
    }
}

export default SurvivalSettings;
