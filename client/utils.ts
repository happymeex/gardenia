import Phaser from "phaser";
import {
    Buff,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    DEFAULT_FADE_TIME,
    getSpriteMetaData,
    playerSpriteMetaData,
    SoundKey,
    SpriteMetaData,
    SpriteSheet,
    SpriteSheetSizes,
} from "./constants";
import menuBg from "./static/menu_bg.jpg";
import menuBgBlurred from "./static/menu_bg_blurred.jpg";
import settingsIcon from "./static/settings_icon.png";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import basicBotSpritesheet from "./static/basic_bot_spritesheet.png";
import foxSpritesheet from "./static/fox_spritesheet.png";
import bearSpritesheet from "./static/bear_spritesheet.png";
import iconSheet from "./static/icons.png";
import rockSpritesheet from "./static/rock_projectile_spritesheet.png";
import bombBotSpritesheet from "./static/bomb_bot_spritesheet.png";
import battleMusic from "./static/battle_theme.mp3";
import tutorialTheme from "./static/tutorial_theme.mp3";
import menuTheme from "./static/menu_theme.mp3";
import whooshSound from "./static/whoosh.mp3";
import damageSound from "./static/damage.mp3";
import explosionSound from "./static/explode.mp3";
import { baseColor, darkenedColor, paragraphTextStyleBase } from "./ui";
import { Player } from "./Player";
import { HasLocation } from "./constants";

/** Loads the settings icon image into a scene. */
export function loadSettingsIcon(scene: Phaser.Scene) {
    scene.load.image("settings-icon", settingsIcon);
}

/** Loads a background image of the player character and the fox standing in a ray of light. */
export function loadMenuBg(scene: Phaser.Scene) {
    scene.load.image(SpriteSheet.MENU_BG, menuBg);
}

export function loadMenuBgBlurred(scene: Phaser.Scene) {
    scene.load.image(SpriteSheet.MENU_BG_BLURRED, menuBgBlurred);
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
 * Assumes that the icons spritesheet has been preloaded in `scene` already.
 *
 * @param scene
 * @param playerName
 * @param x horizontal position of the component
 * @param y vertical position of the component
 * @returns an object with properties `container`, `setHealthUI`, `setManaUI`, and `changeIcon`.
 *      `container` is the game object corresponding to the whole UI object itself, and
 *      the others are functions that adjust the health bar, mana bar, and icon, respectively,
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
        SpriteSheet.ICONS,
        playerSpriteMetaData.iconFrame
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
    const changeIcon = (target: SpriteSheet) => {
        icon.setTexture(SpriteSheet.ICONS);
        icon.setFrame(getSpriteMetaData(target).iconFrame);
    };

    container.add([icon, name]);
    container.setDepth(50);
    return { setHealthUI, setManaUI, changeIcon, container };
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

export interface BattleScene extends Phaser.Scene {
    getIsPaused(): boolean;
    addProcess(processName: string, process: number): void;
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
    scene: BattleScene,
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

export interface SpecialKeys {
    foxKey: Phaser.Input.Keyboard.Key;
    bearKey: Phaser.Input.Keyboard.Key;
    humanKey: Phaser.Input.Keyboard.Key;
}
/**
 * @param scene
 * @returns an object containing references to key objects to be checked during each scene update.
 *      If `foxKey.isDown`, then the player character should transform into fox mode.
 *      Similar for `bearKey`.
 */
export function createSpecialKeys(scene: Phaser.Scene): SpecialKeys {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw Error("No Keyboard detected!");
    const foxKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    const bearKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    const humanKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    return { foxKey, bearKey, humanKey };
}

/**
 * Checks for keypresses by the player and transforms the player sprite accordingly.
 * Call this in the update method of a scene.
 *
 * @param player
 * @param keys
 * @returns True if a transformation occurred, false otherwise.
 */
export function handleTransformation(
    player: Player,
    keys: SpecialKeys
): boolean {
    if (keys.foxKey.isDown) {
        return player.transform(SpriteSheet.FOX);
    } else if (keys.bearKey.isDown) {
        return player.transform(SpriteSheet.BEAR);
    } else if (keys.humanKey.isDown) {
        return player.transform(SpriteSheet.PLAYER);
    }
    return false;
}

/**
 * Loads spritesheets. By default, loads all spritesheets needed for
 * the player character: human, fox, bear, basic and bomb bot enemies, icons (for UI component),
 * rock projectile.
 *
 * @param scene
 * @param spriteList List of sprite keys to load. Default value as described above.
 */
export function loadSprites(
    scene: Phaser.Scene,
    spriteList = spriteSheetMap.keys()
) {
    [...spriteList].forEach((spriteKey) => {
        const URL = spriteSheetMap.get(spriteKey);
        scene.load.spritesheet(spriteKey, URL, SpriteSheetSizes[spriteKey]);
    });
}

const spriteSheetMap = new Map([
    [SpriteSheet.PLAYER, playerSpritesheet],
    [SpriteSheet.FOX, foxSpritesheet],
    [SpriteSheet.BEAR, bearSpritesheet],
    [SpriteSheet.BASIC_BOT, basicBotSpritesheet],
    [SpriteSheet.ICONS, iconSheet],
    [SpriteSheet.ROCK_PROJECTILE, rockSpritesheet],
    [SpriteSheet.BOMB_BOT, bombBotSpritesheet],
]);

/**
 * Call this method in the `preload` method of a scene. Loads the audio
 * specified by `audioList` into the scene and assigns each audio the
 * appropriate key.
 *
 * @param scene
 * @param audioList List of keys identifying sounds that should be loaded.
 */
export function loadAudio(scene: Phaser.Scene, audioList: SoundKey[]) {
    audioList.forEach((sound) => {
        const URL = audioMap.get(sound);
        scene.load.audio(sound, URL);
    });
}

const audioMap = new Map([
    [SoundKey.BATTLE, battleMusic],
    [SoundKey.MENU, menuTheme],
    [SoundKey.WHOOSH, whooshSound],
    [SoundKey.DAMAGE, damageSound],
    [SoundKey.EXPLODE, explosionSound],
    [SoundKey.TUTORIAL, tutorialTheme],
]);

/**
 * Fades the game screen to black and then moves to new scene.
 *
 * @param scene starting scene
 * @param nextScene key of the next scene
 * @param onFadeFinish optional function to call right when the fade finishes, before
 *      transitioning to the next scene
 * @param duration duration of the fadeout. If unspecified, then `DEFAULT_FADE_TIME` is used.
 * @param sceneData optional data to pass to next scene
 */
export function fadeToNextScene(
    scene: Phaser.Scene,
    nextScene: string,
    onFadeFinish?: () => void,
    duration?: number,
    sceneData?: Object
) {
    duration = duration ?? DEFAULT_FADE_TIME;
    scene.cameras.main.fadeOut(
        duration,
        0,
        0,
        0,
        (camera, progress: number) => {
            if (progress === 1) {
                if (onFadeFinish) onFadeFinish();
                if (sceneData) scene.scene.start(nextScene, sceneData);
                else scene.scene.start(nextScene);
            }
        }
    );
}

/**
 * Same description as `applyBuff` but only does it once.
 *
 * @param buff
 * @param spriteData
 */
function applyBuffOnce(buff: Buff, spriteData: SpriteMetaData): SpriteMetaData {
    const newData = { ...spriteData };
    const newAttackData = { ...spriteData.attackData };
    newAttackData.damage *= buff.DamageMultiplier;
    newData.attackData = newAttackData;
    newData.walkSpeed *= buff.SpeedMultiplier;
    newData.health *= buff.HealthMultiplier;

    return newData;
}

/**
 * Computes buffed stats given base stats.
 *
 * @param buff buff to be applied
 * @param spriteData base spriteData to apply the buff to
 * @param numTimes number of times to iteratively apply the buff. Default 1.
 * @returns a new copy of the sprite data with buffed stats.
 */
export function applyBuff(
    buff: Buff,
    spriteData: SpriteMetaData,
    numTimes = 1
): SpriteMetaData {
    let ret = spriteData;
    for (let i = 0; i < numTimes; i++) {
        ret = applyBuffOnce(buff, ret);
    }
    return ret;
}

/**
 * @returns the aggregate buff that would be equivalent to applying
 *      `buff1` and `buff2` in succession.
 */
export function composeBuffs(buff1: Buff, buff2: Buff): Buff {
    const ret: Buff = {
        HealthMultiplier: buff1.HealthMultiplier * buff2.HealthMultiplier,
        DamageMultiplier: buff1.DamageMultiplier * buff2.DamageMultiplier,
        SpeedMultiplier: buff1.SpeedMultiplier * buff2.SpeedMultiplier,
    };
    return ret;
}
