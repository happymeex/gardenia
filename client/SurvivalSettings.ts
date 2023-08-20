import Phaser from "phaser";
import { menuTextStyleBase } from "./ui";
import { makeClickable } from "./utils";

class SurvivalSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "survival-settings" });
    }
    create() {
        const container = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        const returnToHome = this.add.text(
            -200,
            200,
            "Return to menu",
            menuTextStyleBase
        );
        const begin = this.add.text(200, 200, "Begin", menuTextStyleBase);
        returnToHome.setOrigin(0.5);
        begin.setOrigin(0.5);
        makeClickable(returnToHome, this, () => this.scene.start("main-menu"));
        makeClickable(begin, this, () => this.scene.start("survival"));
        container.add([returnToHome, begin]);
    }
}

export default SurvivalSettings;
