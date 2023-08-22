import Phaser from "phaser";
import { baseColorNumber, menuTextStyleBase } from "../ui";
import { makeClickable } from "../utils";

class BrawlSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-settings" });
    }

    create() {
        const container = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        const header = this.add.text(0, -250, "Brawl", {
            ...menuTextStyleBase,
            fontSize: "72px",
        });
        const returnToHome = this.add.text(
            -400,
            -250,
            "\u2039 Back",
            menuTextStyleBase
        );
        const joinBrawl = this.add.text(
            0,
            -150,
            "Join existing brawl",
            menuTextStyleBase
        );
        makeClickable(joinBrawl, this, () => {
            this.scene.start("brawl-join");
        });
        const createNew = this.add.text(
            0,
            150,
            "Create new brawl",
            menuTextStyleBase
        );
        makeClickable(createNew, this, () => {
            this.scene.start("brawl-create");
        });
        const orText = this.add.text(0, 0, "Or", menuTextStyleBase);
        const leftLine = this.add.line(0, 0, -63, 0, -3, 0, baseColorNumber);
        const rightLine = this.add.line(0, 0, 60, 0, 120, 0, baseColorNumber);
        makeClickable(returnToHome, this, () => {
            this.scene.start("main-menu");
        });
        container.add(
            [
                header,
                returnToHome,
                joinBrawl,
                orText,
                leftLine,
                rightLine,
                createNew,
            ].map((item) => item.setOrigin(0.5))
        );
    }
}

export default BrawlSettings;
