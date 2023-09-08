import Phaser from "phaser";
import { CANVAS_CENTER, CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

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
    headerMarginBottom: 128,
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
    const header = scene.add.text(
        0,
        -pauseMenu.headerMarginBottom,
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
                scene.cameras.main.fadeOut(
                    500,
                    0,
                    0,
                    0,
                    (camera, progress: number) => {
                        if (progress === 1) {
                            onLeave();
                            scene.scene.start("main-menu");
                        }
                    }
                );
            },
        },
    ];
    const buttons = buttonData.map(({ label, onClick }, i) => {
        const textButton = scene.add.text(
            0,
            pauseMenu.optionSpacing * i,
            label,
            pauseMenu.optionStyle
        );
        makeClickable(textButton, scene, onClick);
        return textButton;
    });
    menuTextContainer.add(
        [header, ...buttons].map((item) => item.setOrigin(0.5))
    );

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
        document.body.style.cursor = "default";
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
