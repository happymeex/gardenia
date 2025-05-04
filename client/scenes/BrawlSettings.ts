import Phaser from "phaser";
import {
    CANVAS_CENTER,
    ImageAsset,
    mainMenuFade,
    SpriteSheet,
} from "../utils/constants";
import {
    menuTextStyleBase,
    makeClickable,
    paragraphTextStyleBase,
} from "../utils/ui";

class BrawlSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-settings" });
    }

    create() {
        this.add.image(...CANVAS_CENTER, ImageAsset.MENU_BG_BLURRED);
        const container = this.add.container(...CANVAS_CENTER);
        const header = this.add.text(0, -250, "Brawl", {
            ...menuTextStyleBase,
            fontSize: "72px",
        });
        const subHeader = this.add.text(
            0,
            -200,
            "Duke it out with friends!",
            paragraphTextStyleBase
        );
        const returnToHome = this.add.text(
            -400,
            -250,
            "\u2039 Back",
            menuTextStyleBase
        );
        const joinBrawl = this.add.text(
            0,
            -80,
            "Join existing brawl",
            menuTextStyleBase
        );
        makeClickable(joinBrawl, this, () => {
            this.scene.start("brawl-join");
        });
        const createNew = this.add.text(
            0,
            80,
            "Create new brawl",
            menuTextStyleBase
        );
        makeClickable(createNew, this, () => {
            this.scene.start("brawl-create");
        });
        const orText = this.add.text(0, 0, "Or", menuTextStyleBase);
        makeClickable(returnToHome, this, () => {
            mainMenuFade.value = false;
            this.scene.start("main-menu");
        });

        // Difficulty Setting
        this.add.text(CANVAS_CENTER[0] - 100, CANVAS_CENTER[1] - 50, "Difficulty:", menuTextStyleBase)
            .setOrigin(0.5);

        const difficultySelect = this.add.dom(CANVAS_CENTER[0] + 50, CANVAS_CENTER[1] - 50, 'select', {
            style: 'background-color: rgba(255, 255, 255, 0.2); color: white; border: 1px solid white; padding: 5px;',
            options: 'Easy|Medium|Hard'
        })
            .setOrigin(0.5)
            .addListener('change')
            .on('change', (event) => {
                const selectedDifficulty = (difficultySelect.node as HTMLSelectElement).value;
                console.log('Selected difficulty:', selectedDifficulty);
                // Store the selected difficulty in a variable or use it to adjust game settings
            });

        container.add(
            [header, subHeader, returnToHome, joinBrawl, orText, createNew].map(
                (item) => item.setOrigin(0.5)
            )
        );
    }
}

export default BrawlSettings;
