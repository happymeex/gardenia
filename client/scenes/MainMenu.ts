import Phaser from "phaser";
import { makeClickable, mainMenu } from "../utils/ui";
import {
    CANVAS_CENTER,
    ImageAsset,
    Sound,
    SoundKey,
    DEFAULT_FADE_TIME,
    mainMenuFade,
} from "../utils/constants";
import menuTheme from "../static/menu_theme.mp3";
import { fadeToNextScene, loadMenuBg, loadMenuBgBlurred } from "../utils/utils";
import { BGM } from "../BGM";

const buttonData = [
    {
        label: "Tutorial",
        nextScene: "tutorial",
    },
    {
        label: "Survival",
        nextScene: "survival-settings",
    },
    { label: "Brawl", nextScene: "brawl-settings" },
    {
        label: "Story",
        nextScene: "story",
    },
    {
        label: "Options",
        nextScene: "options",
    },
];

class MainMenu extends Phaser.Scene {
    public constructor() {
        super({ key: "main-menu" });
    }
    preload() {
        loadMenuBg(this);
        loadMenuBgBlurred(this);
        this.load.audio(SoundKey.MENU, menuTheme);
    }
    create() {
        if (mainMenuFade.value)
            this.cameras.main.fadeIn(DEFAULT_FADE_TIME, 0, 0, 0);
        else mainMenuFade.value = true;

        this.add.image(...CANVAS_CENTER, ImageAsset.MENU_BG);
        BGM.play(this, Sound.MENU_THEME, false);
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
                if (nextScene === "tutorial") {
                    BGM.fadeOut(this);
                    fadeToNextScene(this, nextScene);
                } else {
                    this.scene.start(nextScene);
                }
            });
            menuTextContainer.add(navButton);
            navButton.setOrigin(0.5); // center-align text
        });
    }
}

export default MainMenu;
