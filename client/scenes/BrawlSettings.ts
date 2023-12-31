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
        container.add(
            [header, subHeader, returnToHome, joinBrawl, orText, createNew].map(
                (item) => item.setOrigin(0.5)
            )
        );
    }
}

export default BrawlSettings;
