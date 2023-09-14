import Phaser from "phaser";
import { BGM } from "./BGM";
import { CANVAS_CENTER, CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { fadeToNextScene } from "./utils";
import { USER, OPTIONS } from "./User";

export type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export const baseColor = "#f5efa4";
export const darkenedColor = "#8f8b5d";
export const baseColorNumber = 0xf5efa4;
export const capitalFont = "Alegreya SC";
export const lowercaseFont = "Alegreya";
/** Text style for menu text. Use for clickable buttons as well. */
export const menuTextStyleBase: TextStyle = {
    color: baseColor,
    fontFamily: capitalFont,
    fontSize: "40px",
};

/** Text style for lowercase, body text, small font size. */
export const paragraphTextStyleBase: TextStyle = {
    color: baseColor,
    fontFamily: lowercaseFont,
    fontSize: "24px",
};

/** Text style for lowercase, body text, medium font size. */
export const largeParagraph: TextStyle = {
    ...paragraphTextStyleBase,
    fontSize: "32px",
};

type MenuStyle = {
    headerStyle: TextStyle;
    optionStyle: TextStyle;
    optionSpacing: number;
    headerMarginBottom: number;
};

/** Styles for main menu. Specifies font, font size, spacing. */
export const mainMenu: MenuStyle = {
    headerStyle: {
        ...menuTextStyleBase,
        fontSize: "120px",
    },
    optionStyle: {
        ...menuTextStyleBase,
        fontSize: "40px",
    },
    optionSpacing: 60,
    headerMarginBottom: 108,
};

/** Styles for in-game pause menu. Specifies font, font size, spacing. */
export const pauseMenu: MenuStyle = {
    headerStyle: {
        ...menuTextStyleBase,
        fontSize: "72px",
    },
    optionStyle: {
        ...menuTextStyleBase,
        fontSize: "32px",
    },
    optionSpacing: 48,
    headerMarginBottom: 80,
};

/**
 * Creates and adds a settings button icon in the top right corner
 * as well as the in-game pause menu that appears when that button is clicked.
 * The menu contains clickable options for resuming the game, returning
 * to the main menu, or adjusting player options.
 *
 * @param scene
 * @param onOpen
 * @param onClose
 * @param onLeave
 * @returns the button object (so that the caller may enable/disable its interactivity as needed)
 */
export function configurePauseMenu(
    scene: Phaser.Scene,
    onOpen = () => {},
    onClose = () => {},
    onLeave = () => {}
): Phaser.GameObjects.Image {
    const offset = 50;
    const settingsButton = scene.add.image(
        scene.cameras.main.width - offset,
        offset,
        "settings-icon"
    );
    settingsButton.setDepth(98);
    const darkenOverlay = createDarkenedOverlay(scene);
    darkenOverlay.setVisible(false);
    makeClickable(settingsButton, scene, () => {
        darkenOverlay.setVisible(true);
        menuTextContainer.setVisible(true);
        settingsButton.disableInteractive();
        onOpen();
    });
    const menuTextContainer = scene.add.container(...CANVAS_CENTER);
    menuTextContainer.setDepth(100);
    const upShift = 100;
    const header = scene.add.text(
        0,
        -pauseMenu.headerMarginBottom - upShift,
        "Menu",
        pauseMenu.headerStyle
    );
    const buttonData = [
        {
            label: "Resume game",
            onClick: () => {
                darkenOverlay.setVisible(false);
                menuTextContainer.setVisible(false);
                settingsButton.setInteractive(true);
                onClose();
            },
        },
        {
            label: "Return to home",
            onClick: () => {
                BGM.fadeOut(scene);
                fadeToNextScene(scene, "main-menu", onLeave);
            },
        },
    ];

    const buttons = buttonData.map(({ label, onClick }, i) => {
        const textButton = scene.add.text(
            0,
            -upShift + pauseMenu.optionSpacing * i,
            label,
            pauseMenu.optionStyle
        );
        makeClickable(textButton, scene, onClick);
        return textButton;
    });

    // add options controls
    const downShift = 60;
    const optionsHeader = scene.add
        .text(0, downShift, "Options", pauseMenu.headerStyle)
        .setOrigin(0.5);
    const settings = USER.getSettings();
    const options = scene.add.container(
        0,
        downShift + pauseMenu.headerMarginBottom
    );
    OPTIONS.forEach(({ label, onChange, setting }, i) => {
        const optionContainer = scene.add.container(0, 60 * i);
        const checkbox = new Checkbox(
            scene,
            -100,
            0,
            settings[setting],
            onChange
        );
        const text = scene.add
            .text(-50, 0, label, paragraphTextStyleBase)
            .setOrigin(0, 0.5);
        optionContainer.add(text);
        checkbox.addToContainer(optionContainer);
        options.add(optionContainer);
    });

    // put everything together
    menuTextContainer.add(
        [header, ...buttons].map((item) => item.setOrigin(0.5))
    );
    menuTextContainer.add([optionsHeader, options]);

    menuTextContainer.setVisible(false);
    return settingsButton;
}

/**
 * Creates and returns a semi-transparent darkened overlay covering the whole game canvas.
 * By default, the overlay will be visible.
 *
 * @param scene
 * @returns the overlay object
 */
export function createDarkenedOverlay(
    scene: Phaser.Scene
): Phaser.GameObjects.Graphics {
    const darkenOverlay = scene.add.graphics();
    darkenOverlay.fillStyle(0x000000, 0.5);
    darkenOverlay.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    darkenOverlay.setDepth(99);
    return darkenOverlay;
}

/**
 * Makes a given game object interactive: attaches a click handler and adds
 * hover styling.
 *
 * @param item The game object
 * @param scene Scene containing `item`
 * @param onClick click handler
 * @param scaleX scale factor in x direction on hover
 * @param scaleY scale factor in y direction on hover
 * @param duration duration of hover animation
 */
export function makeClickable(
    item: Phaser.GameObjects.GameObject,
    scene: Phaser.Scene,
    onClick: () => void,
    revertCursorOnClick = true,
    scaleX = 1.05,
    scaleY = 1.05,
    duration = 150
) {
    item.setInteractive();
    item.on("pointerup", () => {
        onClick();
        scene.tweens.add({
            targets: item,
            scaleX: 1,
            scaleY: 1,
            duration,
        });
        if (revertCursorOnClick) document.body.style.cursor = "default";
    });
    item.on("pointerover", () => {
        document.body.style.cursor = "pointer";
        scene.tweens.add({
            targets: item,
            scaleX,
            scaleY,
            duration,
        });
    });
    item.on("pointerout", () => {
        document.body.style.cursor = "default";
        scene.tweens.add({
            targets: item,
            scaleX: 1,
            scaleY: 1,
            duration,
        });
    });
}

const CHECKBOX_SIZE = 32;

export class Checkbox {
    private innerFill: Phaser.GameObjects.Rectangle;
    private outerBox: Phaser.GameObjects.Rectangle;

    /**
     * Adds a checkbox to `scene` whose checked status is given by `initialState`.
     *
     * @param scene Scene to add the checkbox to
     * @param x x-coordinate of checkbox location
     * @param y y-coordinate of checkbox location
     * @param checked initial status of the checkbox.
     * @param onChange callback function invoked each time the checkbox is toggled.
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        private checked: boolean,
        private onChange: (state: boolean) => void
    ) {
        this.outerBox = scene.add
            .rectangle(x, y, CHECKBOX_SIZE, CHECKBOX_SIZE)
            .setStrokeStyle(4, baseColorNumber);
        this.innerFill = scene.add
            .rectangle(x, y, 0.6 * CHECKBOX_SIZE, 0.6 * CHECKBOX_SIZE)
            .setFillStyle(baseColorNumber);
        if (!checked) {
            this.innerFill.setVisible(false);
        }
        makeClickable(
            this.outerBox,
            scene,
            () => {
                this.setState(!this.checked);
            },
            false,
            1,
            1,
            0.1
        );
    }

    /**
     * Adds the checkbox to `container`. Note that the coordinates `x`, `y` passed into
     * the constructor become relative to the container's position.
     *
     */
    public addToContainer(container: Phaser.GameObjects.Container) {
        container.add([this.outerBox, this.innerFill]);
    }

    /**
     * Checks the checkbox if `state` is true and unchecks otherwise.
     *
     * @param state if true, box will be checked, otherwise unchecked.
     * @param pure if true, then no extra effects will occur -- just the toggling
     *      of the checkbox. If false, then this method calls the `onChange` method
     *      passed in to the constructor. Default false.
     */
    public setState(state: boolean, pure = false) {
        this.checked = state;
        if (!pure) this.onChange(state);
        this.innerFill.setVisible(state);
    }
}
