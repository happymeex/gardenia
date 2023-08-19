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
    settingsButton.setInteractive();
    settingsButton.on("pointerover", () => {
        document.body.style.cursor = "pointer";
        scene.tweens.add({
            targets: settingsButton,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 120,
        });
    });
    settingsButton.on("pointerout", () => {
        document.body.style.cursor = "default";
        scene.tweens.add({
            targets: settingsButton,
            scaleX: 1,
            scaleY: 1,
            duration: 120,
        });
    });
    settingsButton.on("pointerup", () => {
        scene.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress: number) => {
            if (progress === 1) {
                scene.scene.start("main-menu");
            }
        });
    });
}
