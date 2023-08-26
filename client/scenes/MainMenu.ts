import Phaser from "phaser";
import { makeClickable } from "../utils";
import { mainMenu } from "../ui";
import { CANVAS_CENTER } from "../constants";

const buttonData = [
    {
        label: "Survival",
        nextScene: "survival-settings",
    },
    { label: "Brawl", nextScene: "brawl-settings" },
    {
        label: "Story",
        nextScene: "story",
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
        const menuTextContainer = this.add.container(...CANVAS_CENTER);
        const title = this.add
            .text(
                0,
                -mainMenu.headerMarginBottom,
                "Gardenia",
                mainMenu.headerStyle
            )
            .setOrigin(0.5);
        menuTextContainer.add(title);

        buttonData.forEach(({ label, nextScene }, i) => {
            const navButton = this.add.text(
                0,
                mainMenu.optionSpacing * i,
                label,
                mainMenu.optionStyle
            );
            makeClickable(navButton, this, () => {
                this.scene.start(nextScene);
            });
            menuTextContainer.add(navButton);
            navButton.setOrigin(0.5); // center-align text
        });
    }
}

export default MainMenu;
