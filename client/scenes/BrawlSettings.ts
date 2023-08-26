import Phaser from "phaser";
import { CANVAS_CENTER } from "../constants";
import { menuTextStyleBase } from "../ui";
import { makeClickable } from "../utils";

class BrawlSettings extends Phaser.Scene {
    public constructor() {
        super({ key: "brawl-settings" });
    }

    create() {
        const container = this.add.container(...CANVAS_CENTER);
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
            -100,
            "Join existing brawl",
            menuTextStyleBase
        );
        makeClickable(joinBrawl, this, () => {
            this.scene.start("brawl-join");
        });
        const createNew = this.add.text(
            0,
            100,
            "Create new brawl",
            menuTextStyleBase
        );
        makeClickable(createNew, this, () => {
            this.scene.start("brawl-create");
        });
        const orText = this.add.text(0, 0, "Or", menuTextStyleBase);
        makeClickable(returnToHome, this, () => {
            this.scene.start("main-menu");
        });
        container.add(
            [header, returnToHome, joinBrawl, orText, createNew].map((item) =>
                item.setOrigin(0.5)
            )
        );
    }
}

export default BrawlSettings;
