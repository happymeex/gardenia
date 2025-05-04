import Phaser from "phaser";
import { BGM } from "../BGM";
import {
    CANVAS_CENTER,
    DEFAULT_DIFFICULTY,
    DEFAULT_FADE_TIME,
    difficultyLevels,
    getDifficultyParams,
    ImageAsset,
    mainMenuFade,
    SpriteSheet,
    SurvivalDifficultyParams,
} from "../utils/constants";
import {
    menuTextStyleBase,
    paragraphTextStyleBase,
    makeClickable,
    Checkbox,
} from "../utils/ui";
import { fadeToNextScene } from "../utils/utils";

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
            mainMenuFade.value = false;
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

        // Difficulty Setting
        this.add.text(CANVAS_CENTER[0] - 100, CANVAS_CENTER[1] - 50, "Difficulty:", menuTextStyleBase)
            .setOrigin(0.5);

        const difficultySelect = this.add.dom(CANVAS_CENTER[0] + 50, CANVAS_CENTER[1] - 50, 'select', {
            style: 'background-color: rgba(255, 255, 255, 0.2); color: white; border: 1px solid white; padding: 5px;',
            options: difficultyLevels.join('|')
        })
            .setOrigin(0.5)
            .addListener('change')
            .on('change', (event) => {
                const selectedDifficulty = (difficultySelect.node as HTMLSelectElement).value as typeof difficultyLevels[number];
                console.log('Selected difficulty:', selectedDifficulty);
                this.survivalDifficultyParams = getDifficultyParams(selectedDifficulty);
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
