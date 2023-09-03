import Phaser from "phaser";
import { CANVAS_CENTER } from "../constants";
import { menuTextStyleBase, makeClickable } from "../ui";

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
            this.scene.start("survival");
        });
        container.add(
            [header, returnToHome, begin].map((item) => item.setOrigin(0.5))
        );
    }
}

export default SurvivalSettings;
