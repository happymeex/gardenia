import Phaser from "phaser";
import {
    CANVAS_CENTER,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    PlayerFrames,
    SpriteSheet,
} from "./constants";
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
    const darkenOverlay = createDarkenedOverlay(scene);
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
 * Creates a transparent rectangular texture which can be referenced by `key`.
 * If a texture with key `key` already exists in `scene`, this function does nothing.
 *
 * @param scene scene to which the texture should belong
 * @param key id to assign to the texture
 * @param width
 * @param height
 */
export function makeTransparentRectTexture(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number
): void {
    if (scene.textures.exists(key)) return;
    const newTexture = scene.textures.createCanvas(key, width, height);
    if (newTexture === null)
        throw new Error("Failed to create new canvas texture");
    const context = newTexture.context;
    context.clearRect(0, 0, width, height);
    newTexture.refresh();
}

/**
 * Erects invisible walls on the left and right edges of the screen and adds them
 * to the static group `platforms`.
 *
 * @param platforms static group to add the walls to, for collision detection.
 */
export function createCanvasBoundaryWalls(
    platforms: Phaser.Physics.Arcade.StaticGroup
) {
    const scene = platforms.scene;
    const keys = ["boundary-wall-left", "boundary-wall-right"];
    keys.forEach((key) => {
        if (scene.textures.exists(key)) return;
        makeTransparentRectTexture(scene, key, 10, CANVAS_HEIGHT);
    });
    platforms.create(-10, CANVAS_HEIGHT / 2, keys[0]);
    platforms.create(CANVAS_WIDTH + 10, CANVAS_HEIGHT / 2, keys[1]);
}

/**
 * Creates a UI component showing the player's character icon (indicating their
 * current animal mode) and their health/mana bars.
 *
 * Assumes that the player spritesheet has been preloaded in `scene` already.
 *
 * @param scene
 * @param playerName
 * @param x horizontal position of the component
 * @param y vertical position of the component
 * @returns an object with properties `setHealthUI` and `setManaUI` whose values are
 *      functions that adjust the health and mana bars respectively, given a percentage input.
 */
export function addPlayerStatusUI(
    scene: Phaser.Scene,
    playerName: string,
    x: number,
    y: number
) {
    const container = scene.add.container(x, y);
    /** Amount to shift the icon to the left of container center. */
    const iconOffset = 50;
    /** Amount to shift the name and health, mana bars to the right of container center */
    const nameOffset = 15;
    const barWidth = 160;
    const barHeight = 10;
    const icon = scene.add.sprite(
        -iconOffset,
        0,
        SpriteSheet.PLAYER,
        PlayerFrames.ICON
    );
    const name = scene.add.text(nameOffset, -30, playerName, {
        ...paragraphTextStyleBase,
        color: "#ffffff",
    });
    const barOffset = icon.width - iconOffset + nameOffset;
    const setHealthUI = assembleStatBar(
        container,
        barOffset,
        0,
        barWidth,
        barHeight,
        0x3a5c43,
        0x32ab52
    );
    const setManaUI = assembleStatBar(
        container,
        barOffset,
        15,
        barWidth,
        barHeight,
        0x35295e,
        0x5c3ac9
    );

    container.add([icon, name]);
    container.setDepth(50);
    return { setHealthUI, setManaUI };
}

function assembleStatBar(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    baseColor: number,
    fillColor: number
) {
    container.scene;
    const base = container.scene.add.rectangle(x, y, width, height);
    const fill = container.scene.add.rectangle(x, y, width, height);
    base.setFillStyle(baseColor);
    fill.setFillStyle(fillColor);

    const outline = container.scene.add.rectangle(x, y, width, height);
    outline.setFillStyle(0, 0); // transparent interior
    outline.setStrokeStyle(3, 0x000000);

    const posX = outline.x;
    const setFill = (ratio: number) => {
        fill.setScale(ratio, 1);
        fill.setPosition(posX - ((1 - ratio) * width) / 2, y);
    };
    container.add([base, fill, outline]);
    return setFill;
}

/**
 * Makes the given sprite flash white for 50ms.
 *
 * @param sprite
 */
export function flashWhite(sprite: Phaser.GameObjects.Sprite): void {
    sprite.setTintFill(0xe0e0e0);
    setTimeout(() => sprite.clearTint(), 50);
}

/**
 * Converts a given number of seconds to a string of the form minutes:seconds
 */
function convertSecondsToTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - 60 * minutes;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface Pausable extends Phaser.Scene {
    getIsPaused(): boolean;
}

/**
 * Adds a self-managed timer to a scene.
 *
 * @param scene scene with a `getIsPaused` method.
 * @param x x-coordinate to place the timer
 * @param y y-coordinate to place the timer
 * @returns an object with two fields:
 *      `timeText` is the Phaser text object associated with the timer,
 *      `processNumber` is the numerical id of the setInterval process
 *      that updates the timer every second. Call `clearInterval` to terminate
 *      this process (e.g. when changing scenes)
 */
export function createTimer(
    scene: Pausable,
    x: number,
    y: number
): { timeText: Phaser.GameObjects.Text; processNumber: number } {
    const timeText = scene.add.text(x, y, "0:00", {
        ...paragraphTextStyleBase,
        fontSize: "32px",
    });
    let numSecs = 0;
    const processNumber = setInterval(() => {
        if (scene.getIsPaused()) return;
        numSecs++;
        timeText.text = convertSecondsToTime(numSecs);
    }, 1000);
    return { timeText, processNumber };
}

interface HasLocation {
    getPosition(): { x: number; y: number };
    getBounds(): Phaser.Geom.Rectangle;
}

export function intersect(sprite1: HasLocation, sprite2: HasLocation): boolean {
    return Phaser.Geom.Intersects.RectangleToRectangle(
        sprite1.getBounds(),
        sprite2.getBounds()
    );
}

export function inRange(
    sprite1: HasLocation,
    sprite2: HasLocation,
    radius: number
): boolean {
    const { x: x1, y: y1 } = sprite1.getPosition();
    const { x: x2, y: y2 } = sprite2.getPosition();
    return (x1 - x2) ** 2 + (y1 - y2) ** 2 < radius * radius;
}
