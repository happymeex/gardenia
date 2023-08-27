import Phaser from "phaser";
import { CANVAS_CENTER, CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import settingsIcon from "./static/settings_icon.png";
import {
    baseColor,
    darkenedColor,
    paragraphTextStyleBase,
    pauseMenu,
} from "./ui";

/** Loads the settings icon image into a scene. */
export function loadSettingsIcon(scene: Phaser.Scene) {
    scene.load.image("settings-icon", settingsIcon);
}

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
 */
export function configurePauseMenu(
    scene: Phaser.Scene,
    onOpen = () => {},
    onClose = () => {},
    onLeave = () => {}
) {
    const offset = 50;
    const settingsButton = scene.add.image(
        scene.cameras.main.width - offset,
        offset,
        "settings-icon"
    );
    settingsButton.setDepth(98);
    const darkenOverlay = scene.add.graphics();
    darkenOverlay.fillStyle(0x000000, 0.5);
    darkenOverlay.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    darkenOverlay.setDepth(99);
    darkenOverlay.setVisible(false);
    makeClickable(settingsButton, scene, () => {
        darkenOverlay.setVisible(true);
        menuTextContainer.setVisible(true);
        onOpen();
    });
    //const menuPanel = makePauseMenu(scene, onClose, onLeave);
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
    text.setStyle({ ...text.style, color: baseColor });
}

/**
 * Flashes a notification message at the bottom of the screen.
 * Message fades out after two seconds.
 *
 * @param scene Scene in which the message will be shown
 * @param message Message to show.
 */
export function showNotification(scene: Phaser.Scene, message: string) {
    const text = scene.add
        .text(CANVAS_WIDTH / 2, 650, message, paragraphTextStyleBase)
        .setOrigin(0.5)
        .setAlign("center");
    setTimeout(
        () =>
            scene.tweens.add({
                targets: text,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    text.destroy();
                },
            }),
        2000
    );
}

/**
 * Creates a transparent rectangular texture. If a texture with key `key`
 * already exists in `scene`, does nothing.
 *
 * @param scene scene to which the texture should belong
 * @param key id to assign to the texture
 * @param width
 * @param height
 */
export function createTransparentGroundTexture(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number
): void {
    if (scene.textures.exists(key)) return;
    const newTexture = scene.textures.createCanvas(key, width, height);
    const context = newTexture.context;
    context.clearRect(0, 0, width, height);
    newTexture.refresh();
}
