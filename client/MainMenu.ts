import Phaser from "phaser";
import { makeClickable } from "./utils";

const SCENES = [
    {
        label: "Survival",
        key: "survival",
    },
    {
        label: "Brawl",
        key: "brawl",
    },
];

const SHARED_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
    color: "white",
    fontFamily: "Alegreya SC",
};
const TITLE_FONT_SIZE = 96;
const SUBHEADER_FONT_SIZE = 60;
const SUBHEADER_SPACING = 80;

class MainMenu extends Phaser.Scene {
    public constructor() {
        super({ key: "main-menu" });
    }
    preload() {
        //
    }
    create() {
        const menuTextContainer = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        const title = this.add
            .text(0, -120, "Gardenia", {
                ...SHARED_TEXT_STYLE,
                fontStyle: "bold",
                fontSize: `${TITLE_FONT_SIZE}px`,
            })
            .setOrigin(0.5);
        menuTextContainer.add(title);

        SCENES.forEach(({ label, key }, i) => {
            const navButton = this.add.text(0, SUBHEADER_SPACING * i, label, {
                ...SHARED_TEXT_STYLE,
                fontSize: `${SUBHEADER_FONT_SIZE}px`,
            });
            makeClickable(navButton, this, () => {
                this.scene.start(key);
            });
            menuTextContainer.add(navButton);
            navButton.setOrigin(0.5); // center-align text
        });
    }
    update() {
        //
    }
}

export default MainMenu;
