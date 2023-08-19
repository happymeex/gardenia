import Phaser from "phaser";
import { makeClickable } from "./utils";
import { mainMenu } from "./ui";

const SCENES = [
    {
        label: "Story",
        key: "story",
    },
    {
        label: "Survival",
        key: "survival",
    },
    {
        label: "Brawl",
        key: "brawl",
    },
];

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
            .text(
                0,
                -mainMenu.headerMarginBottom,
                "Gardenia",
                mainMenu.headerStyle
            )
            .setOrigin(0.5);
        menuTextContainer.add(title);

        SCENES.forEach(({ label, key }, i) => {
            const navButton = this.add.text(
                0,
                mainMenu.optionSpacing * i,
                label,
                mainMenu.optionStyle
            );
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
