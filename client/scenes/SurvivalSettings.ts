import Phaser from "phaser";
import { BGM } from "../BGM";
import {
    CANVAS_CENTER,
    DEFAULT_DIFFICULTY,
    DEFAULT_FADE_TIME,
    difficultyLevels,
    getDifficultyParams,
    ImageAsset,
    SpriteSheet,
    SurvivalDifficultyParams,
} from "../constants";
import {
    menuTextStyleBase,
    paragraphTextStyleBase,
    makeClickable,
    Checkbox,
} from "../ui";
import { fadeToNextScene } from "../utils";

class SurvivalSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "survival-settings" });
    }
    private survivalDifficultyParams: SurvivalDifficultyParams =
        getDifficultyParams(DEFAULT_DIFFICULTY);

    create() {
        this.add.image(...CANVAS_CENTER, ImageAsset.MENU_BG_BLURRED);
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

        // Difficulty selection UI
        const rowSpacing = 50;
        const diffContainer = this.add.container(
            0,
            -20,
            this.add
                .text(0, -60, "Difficulty:", menuTextStyleBase)
                .setOrigin(0.5)
        );
        const checkboxes: Array<Checkbox> = [];
        difficultyLevels.forEach((level, i) => {
            const checkbox = new Checkbox(
                this,
                -50,
                0,
                level === DEFAULT_DIFFICULTY,
                () => {
                    this.survivalDifficultyParams = getDifficultyParams(level);
                    checkboxes.forEach((box, j) => {
                        if (i === j) return;
                        box.setState(false, true);
                    });
                },
                true
            );
            checkboxes.push(checkbox);
        });
        difficultyLevels.forEach((level, i) => {
            const row = this.add.container(0, i * rowSpacing);
            const checkbox = checkboxes[i];
            const text = this.add
                .text(0, 0, level, paragraphTextStyleBase)
                .setOrigin(0, 0.5);
            checkbox.addToContainer(row);
            row.add(text);
            diffContainer.add(row);
        });
        container.add(
            [header, subHeader, returnToHome, begin].map((item) =>
                item.setOrigin(0.5)
            )
        );
        container.add(diffContainer);
    }
}

export default SurvivalSettings;
