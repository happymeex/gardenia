import Phaser from "phaser";
import settingsIcon from "./static/settings_icon.png";
import { settingsPanel } from "./ui";

export const MENU_TEXTSTYLE_BASE: Phaser.Types.GameObjects.Text.TextStyle = {
    color: "white",
    fontFamily: "Alegreya SC",
};

export function loadSettingsIcon(scene: Phaser.Scene) {
    scene.load.image("settings-icon", settingsIcon);
}

export function configureSettingsPanel(
    scene: Phaser.Scene,
    onOpen = () => {},
    onClose = () => {},
    leave = () => {}
) {
    const offset = 50;
    const settingsButton = scene.add.image(
        scene.cameras.main.width - offset,
        offset,
        "settings-icon"
    );
    makeClickable(settingsButton, scene, () => {
        menuPanel.setVisible(true);
        onOpen();
    });
    const menuPanel = makeSettingsPanel(scene, onClose, leave);
}

function makeSettingsPanel(
    scene: Phaser.Scene,
    onClose = () => {},
    leave = () => {}
): Phaser.GameObjects.Container {
    const menuTextContainer = scene.add.container(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2
    );
    const header = scene.add.text(
        0,
        -settingsPanel.headerMarginBottom,
        "Menu",
        settingsPanel.headerStyle
    );
    const buttonData = [
        {
            label: "Resume game",
            onClick: () => {
                menuTextContainer.setVisible(false);
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
                            leave();
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
            settingsPanel.optionSpacing * i,
            label,
            settingsPanel.optionStyle
        );
        makeClickable(textButton, scene, onClick);
        return textButton;
    });
    menuTextContainer.add(
        [header, ...buttons].map((item) => item.setOrigin(0.5))
    );

    menuTextContainer.setVisible(false);
    return menuTextContainer;
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

export function makeWebSocket(): WebSocket {
    const URL = window.location.href;
    const prod = URL.includes("https");
    const wsURL = URL.replace(prod ? "https" : "http", prod ? "wss" : "ws");
    console.log("websocket URL:", wsURL);
    const socket = new WebSocket(`${wsURL}ws/`);
    return socket;
}
