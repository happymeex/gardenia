import { SpriteAppearance } from "./SpriteBody";

export const CANVAS_WIDTH = 1344;
export const CANVAS_HEIGHT = 756;
export const CANVAS_CENTER = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2] as const;

/** Spritesheet keys. */
export enum SpriteSheet {
    PLAYER = "player",
    BASIC_BOT = "basic-bot",
    PLATFORM = "platform",
    WATERFALL = "waterfall-bg",
    FOX = "fox",
    BEAR = "bear",
    ICONS = "icon",
}

export enum Sound {
    BATTLE = "battle-theme",
    MENU = "menu-theme",
}

export enum AttackType {
    MELEE,
    PROJECTILE,
}

/**
 * Parameters describing an attack.
 */
export type AttackData = {
    readonly damage: number;
    /** If true, attack strikes all targets in range. */
    readonly aoe: boolean;
    /**
     * A nonzero value indicates that the attack should knock back targets that are hit,
     * unless the target has a knockback resistance value higher than this value.
     */
    readonly knockbackPrecedence: number;
    readonly type: AttackType;
};

// Used to compress messages sent via websocket.

/** Shorthands for object fields. */
export enum Field {
    SOURCE = "s",
    TYPE = "t",
    POSITION = "p",
    APPEARANCE = "a",
    VALUE = "v",
    TARGET = "r",
}

/** Shorthands for message types. */
export enum MsgTypes {
    /** For data containing a sprite's position and appearance. */
    SPRITE = "s",
    /** For notifying that a player has hit another player and dealt damage. */
    DAMAGE = "d",
    /**
     * For updates to a player's health UI. A message of type `DAMAGE` should be followed
     * by a message of type `HEALTH` from the target player so that other clients can update
     * their UIs accordingly.
     */
    HEALTH = "h",
}

//////////////////////////////////////

export enum AttackState {
    ATTACKING,
    READY,
}

export const SpriteSheetSizes = {
    [SpriteSheet.PLAYER]: {
        frameWidth: 128,
        frameHeight: 128,
    },
    [SpriteSheet.BASIC_BOT]: {
        frameWidth: 96,
        frameHeight: 128,
    },
    [SpriteSheet.FOX]: {
        frameWidth: 192,
        frameHeight: 128,
    },
    [SpriteSheet.BEAR]: {
        frameWidth: 128,
        frameHeight: 192,
    },
    [SpriteSheet.ICONS]: {
        frameWidth: 128,
        frameHeight: 128,
    },
};

export interface SpriteMetaData {
    /** Key of the spritesheet texture. */
    readonly spriteKey: SpriteSheet;

    /** Width for physics/hitbox purposes. */
    readonly width: number;

    /** Height for physics/hitbox purposes. */
    readonly height: number;

    /** A fallback frame indicating idle status; this frame is the first to appear when user transforms. */
    readonly idleFrame: number;

    /** Frame number of this sprite's corresponding icon in the icon spritesheet. */
    readonly iconFrame: number;

    /** Initial health. */
    readonly health: number;
    readonly walkSpeed: number;
    readonly jumpVelocity: number;
    readonly attackData: AttackData;
}

export const playerSpriteMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.PLAYER,
    width: 64,
    height: 105,
    idleFrame: 27,
    iconFrame: 0,
    walkSpeed: 300,
    health: 100,
    jumpVelocity: 800,
    attackData: {
        damage: 15,
        aoe: false,
        knockbackPrecedence: 0,
        type: AttackType.MELEE,
    },
};

export const basicBotSpriteMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.BASIC_BOT,
    width: 52,
    height: 105,
    iconFrame: -1,
    idleFrame: 18,
    walkSpeed: 200,
    health: 25,
    jumpVelocity: 0,
    attackData: {
        damage: 10,
        aoe: false,
        knockbackPrecedence: 0,
        type: AttackType.MELEE,
    },
};

const foxSpriteMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.FOX,
    width: 180,
    height: 100,
    iconFrame: 1,
    idleFrame: 16,
    walkSpeed: 400,
    health: 100,
    jumpVelocity: 900,
    attackData: {
        damage: 10,
        aoe: false,
        knockbackPrecedence: 1,
        type: AttackType.PROJECTILE,
    },
};

const bearSpriteMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.BEAR,
    width: 100,
    height: 165,
    idleFrame: 14,
    iconFrame: 2,
    health: 100,
    walkSpeed: 175,
    jumpVelocity: 0,
    attackData: {
        damage: 30,
        aoe: true,
        knockbackPrecedence: 2,
        type: AttackType.MELEE,
    },
};

export function getSpriteMetaData(asset: SpriteSheet): SpriteMetaData {
    switch (asset) {
        case SpriteSheet.PLAYER:
            return playerSpriteMetaData;
        case SpriteSheet.BASIC_BOT:
            return basicBotSpriteMetaData;
        case SpriteSheet.FOX:
            return foxSpriteMetaData;
        case SpriteSheet.BEAR:
            return bearSpriteMetaData;
    }
    throw new Error(`No metadata data associated with spritesheet ${asset}`);
}

export interface HasLocation {
    name: string;
    getPosition(): { x: number; y: number };
    getBounds(): Phaser.Geom.Rectangle;
}

export interface HasAppearance extends HasLocation {
    getAppearance(): SpriteAppearance;
}

/**
 * Represents an entity that can be the target of an attack
 * (but which does not necessarily maintain knowledge of its own health).
 */
export interface CanBeHit extends HasLocation {
    /**
     * @param dmg nonnegative value.
     */
    takeDamage(dmg: number): void;
}

/**
 * Represents an entity that 1) can be the target of an attack,
 * and 2) maintains knowledge of its own health internally.
 */
export interface HasHealth extends CanBeHit {
    getHealthPercentage(): number;
}

/**
 * Sentinel object.
 */
class NullAudio {
    public play() {
        throw new Error("Audio is currently null");
    }
    public resume() {
        throw new Error("Audio is currently null");
    }
    public stop() {}
    public destroy() {}
    public isPlaying = false;
    public key = "";
}

export type Audio =
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | NullAudio;

/** Global audio manager. */
export let BGM: { audio: Audio } = { audio: new NullAudio() };
