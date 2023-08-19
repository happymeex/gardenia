import Phaser from "phaser";
import settingsIcon from "./static/settings_icon.png";

export function loadSettingsIcon(scene: Phaser.Scene) {
    scene.load.image("settings-icon", settingsIcon);
}

export function addSettingsIcon(scene: Phaser.Scene) {
    const offset = 50;
    const settingsButton = scene.add.image(
        scene.cameras.main.width - offset,
        offset,
        "settings-icon"
    );
    makeClickable(settingsButton, scene, () => {
        scene.scene.start("main-menu");
    });
    settingsButton.on("pointerup", () => {
        scene.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress: number) => {
            if (progress === 1) {
                scene.scene.start("main-menu");
            }
        });
    });
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
