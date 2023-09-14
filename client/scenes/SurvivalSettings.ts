import Phaser from "phaser";
import { BGM } from "../BGM";
import {
    CANVAS_CENTER,
    DEFAULT_DIFFICULTY,
    DEFAULT_FADE_TIME,
    getDifficultyParams,
    SurvivalDifficultyParams,
} from "../constants";
import {
    menuTextStyleBase,
    paragraphTextStyleBase,
    makeClickable,
} from "../ui";
import { fadeToNextScene } from "../utils";

class SurvivalSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "survival-settings" });
    }
    private survivalDifficultyParams: SurvivalDifficultyParams =
        getDifficultyParams(DEFAULT_DIFFICULTY);

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
            BGM.fadeOut(this);
            fadeToNextScene(
                this,
                "survival",
                () => {},
                DEFAULT_FADE_TIME,
                this.survivalDifficultyParams
            );
        });
        container.add(
            [header, subHeader, returnToHome, begin].map((item) =>
                item.setOrigin(0.5)
            )
        );
    }
}

export default SurvivalSettings;
