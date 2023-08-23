import Phaser from "phaser";
import settingsIcon from "./static/settings_icon.png";
import { baseTextColor, darkenedColor, settingsPanel } from "./ui";

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
 * @param oneAndDone if true, allows only one click
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

/**
 * Opens a websocket connection at the current URL with /ws/`id` appended
 *
 * @param id Used by the server to identify the brawl being created/accessed.
 * @param uid User id
 * @returns WebSocket object
 */
export function makeBrawlWebSocket(
    id: string,
    uid: string,
    isHost: boolean = false
): WebSocket {
    const URL = window.location.href;
    const prod = URL.includes("https");
    const wsURL = URL.replace(prod ? "https" : "http", prod ? "wss" : "ws");
    const socket = new WebSocket(
        `${wsURL}ws/${id}?uid=${uid}${isHost ? "&isHost=true" : ""}`
    );
    return socket;
}

const getRandLetter = () =>
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[
        Math.floor(Math.random() * 52)
    ];

/**
 * Generates a pseudo-random string.
 *
 * @param len desired length of string.
 */
export function getRandomString(len: number): string {
    let ret = "";
    for (let i = 0; i < len; i++) {
        ret += getRandLetter();
    }
    return ret;
}

export function getUserId(): string | null {
    return localStorage.getItem("gardenia-id");
}

export function setUserId(id: string): void {
    localStorage.setItem("gardenia-id", id);
}

export function darkenText(text: Phaser.GameObjects.Text): void {
    text.setStyle({ ...text.style, color: darkenedColor });
}

export function undarkenText(text: Phaser.GameObjects.Text): void {
    text.setStyle({ ...text.style, color: baseTextColor });
}
