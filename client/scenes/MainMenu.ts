import Phaser from "phaser";
import { makeClickable } from "../utils";
import { mainMenu } from "../ui";
import { CANVAS_CENTER, BGM, Sound } from "../constants";
import menuTheme from "../static/menu_theme.mp3";

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
        this.load.audio(Sound.MENU, menuTheme);
    }
    create() {
        if (!BGM.audio.isPlaying) {
            BGM.audio = this.sound.add(Sound.MENU, {
                loop: true,
                volume: 0.7,
            });
            BGM.audio.play();
        }
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
