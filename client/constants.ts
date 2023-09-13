import { SpriteAppearance } from "./SpriteBody";

export const CANVAS_WIDTH = 1344;
export const CANVAS_HEIGHT = 756;
export const CANVAS_CENTER = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2] as const;

/**
 * Spritesheet keys (i.e. each item in this enum corresponds to one .png/.jpg file
 * that can be loaded into a scene).
 */
export enum SpriteSheet {
    PLAYER = "player",
    BASIC_BOT = "basic-bot",
    PLATFORM = "platform",
    WATERFALL = "waterfall-bg",
    FOX = "fox",
    BEAR = "bear",
    ICONS = "icon",
    ROCK_PROJECTILE = "rock",
    BOMB_BOT = "bomb-bot",
}

/**
 * Keys identifying audio files (i.e. each item in this enum corresponds to
 * one .mp3 file that can be loaded into a scene).
 */
export enum SoundKey {
    BATTLE = "b",
    MENU = "m",
    WHOOSH = "w",
    DAMAGE = "d",
    TUTORIAL = "t",
    EXPLODE = "e",
}

/** Keys for identifying particular sound effects. */
export enum Sound {
    SILENCE,
    BATTLE_THEME,
    MENU_THEME,
    TUTORIAL_THEME,
    PLAYER_ATTACK,
    EXPLODE,
    DAMAGE,
}

/** Holds data for all sounds, indexed by keys of type `SoundFX`. */
export const soundTracks = new Map<
    Sound,
    { key: SoundKey; config: Phaser.Types.Sound.SoundConfig }
>([
    [
        Sound.BATTLE_THEME,
        { key: SoundKey.BATTLE, config: { loop: true, volume: 0.7 } },
    ],
    [
        Sound.MENU_THEME,
        { key: SoundKey.MENU, config: { loop: true, volume: 0.7 } },
    ],
    [
        Sound.TUTORIAL_THEME,
        { key: SoundKey.TUTORIAL, config: { loop: true, volume: 1 } },
    ],
    [
        Sound.PLAYER_ATTACK,
        { key: SoundKey.WHOOSH, config: { loop: false, volume: 0.7 } },
    ],
    [
        Sound.EXPLODE,
        { key: SoundKey.EXPLODE, config: { loop: false, volume: 0.8 } },
    ],
    [
        Sound.DAMAGE,
        { key: SoundKey.DAMAGE, config: { loop: false, volume: 0.8 } },
    ],
]);

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
    /** Amount of mana required to execute this attack. If insufficient, attack should not initiate. */
    readonly manaUsage: number;
    readonly type: AttackType;
    /**
     * If defined, then the attack should register only when the frame with index `hitFrame`
     * is reached in the attack animation. Otherwise, the attack should register as soon
     * as the animation is initiated.
     */
    readonly hitFrame?: number;
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
    NAME = "n",
    KEY = "k",
}

/** Shorthands for message types. */
export enum MsgTypes {
    /** For data containing a sprite's position and appearance. */
    SPRITE = "a",
    /** For notifying that a player has hit another player and dealt damage. */
    DAMAGE = "b",
    /**
     * For updates to a player's health UI. A message of type `DAMAGE` should be followed
     * by a message of type `HEALTH` from the target player so that other clients can update
     * their UIs accordingly.
     */
    HEALTH = "c",
    MANA = "m",
    DEATH = "d",
    PROJECTILE_UPDATE = "e",
    PROJECTILE_CREATE = "f",
    PROJECTILE_REMOVE = "g",
    SOUND = "h",
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
    [SpriteSheet.ROCK_PROJECTILE]: {
        frameWidth: 64,
        frameHeight: 64,
    },
    [SpriteSheet.BOMB_BOT]: {
        frameWidth: 96,
        frameHeight: 96,
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
    /** Multiplier to compute damage taken from incoming attacks. */
    readonly defenseMultiplier: number;
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
    defenseMultiplier: 1,
    jumpVelocity: 800,
    attackData: {
        damage: 15,
        aoe: false,
        manaUsage: 0,
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
    defenseMultiplier: 1,
    health: 25,
    jumpVelocity: 0,
    attackData: {
        damage: 10,
        aoe: false,
        knockbackPrecedence: 0,
        manaUsage: 0,
        type: AttackType.MELEE,
    },
};

const foxSpriteMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.FOX,
    width: 76,
    height: 100,
    iconFrame: 1,
    idleFrame: 16,
    walkSpeed: 400,
    health: 100,
    defenseMultiplier: 1.1,
    jumpVelocity: 900,
    attackData: {
        damage: 10,
        aoe: false,
        manaUsage: 20,
        knockbackPrecedence: 1,
        type: AttackType.PROJECTILE,
    },
};

const bearSpriteMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.BEAR,
    width: 80,
    height: 158,
    idleFrame: 14,
    iconFrame: 2,
    health: 100,
    walkSpeed: 175,
    defenseMultiplier: 0.6,
    jumpVelocity: 0,
    attackData: {
        damage: 30,
        aoe: true,
        knockbackPrecedence: 2,
        manaUsage: 0,
        type: AttackType.MELEE,
        hitFrame: 3,
    },
};

export const rockProjectileMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.ROCK_PROJECTILE,
    width: 30,
    height: 30,
    idleFrame: 0,
    // assign meaningless values for the rest
    iconFrame: -1,
    health: 0,
    walkSpeed: 0,
    jumpVelocity: 0,
    defenseMultiplier: 0,
    attackData: {
        damage: 0,
        aoe: false,
        manaUsage: 0,
        knockbackPrecedence: 0,
        type: AttackType.MELEE,
    },
};

export const bombBotMetaData: SpriteMetaData = {
    spriteKey: SpriteSheet.BOMB_BOT,
    width: 50,
    height: 50,
    idleFrame: 0,
    iconFrame: -1,
    health: 1,
    defenseMultiplier: 1,
    walkSpeed: 200,
    jumpVelocity: 0,
    attackData: {
        damage: 60,
        aoe: true,
        manaUsage: 0,
        knockbackPrecedence: 1,
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
        case SpriteSheet.ROCK_PROJECTILE:
            return rockProjectileMetaData;
    }
    throw new Error(`No metadata data associated with spritesheet ${asset}`);
}

/** Represents an entity that has a location. */
export interface HasLocation {
    /**
     * Identifier for the entity, e.g. player's name, enemy label.
     * Should be unique among entities in the scene.
     */
    name: string;
    /** Returns the position of the entity's midpoint. */
    getPosition(): { x: number; y: number };
    /** Returns the bounding rectangle of the entity. Used to determine hitbox/physics. */
    getBounds(): Phaser.Geom.Rectangle;
}

/** Represents a character whose appearance can be described by an animation and a direction. */
export interface HasAppearance extends HasLocation {
    /** Returns the character's currently-playing animation, its direction, and its spritesheet. */
    getAppearance(): SpriteAppearance;
}

/**
 * Represents a character that can be the target of an attack
 * (but which does not necessarily maintain knowledge of its own health).
 */
export interface CanBeHit extends HasLocation {
    /**
     * @param dmg nonnegative value.
     */
    takeDamage(dmg: number): void;
}

/**
 * Represents a character that 1) can be the target of an attack,
 * and 2) maintains knowledge of its own health internally.
 */
export interface HasHealth extends CanBeHit {
    getHealthPercentage(): number;
}

/**
 * Sentinel object.
 */
export class NullSocket {
    public send(msg: string) {}
    public onmessage: () => {};
    public close(code?: number) {}
}

export interface UserSettings {
    /** If true, sound effects (punching, damage, etc.) play. */
    soundFX: boolean;
    /** If true, background music plays. */
    music: boolean;
}

const defaultSettings: UserSettings = {
    soundFX: true,
    music: true,
};

class User {
    private name = "Anonymous";
    private hasSetName = false;
    private settings: UserSettings = defaultSettings;
    constructor() {}

    /** Gets user's name */
    public getName(): string {
        return this.name;
    }

    /**
     * Sets the user's name to `name`. Does nothing on subsequent calls.
     *
     * @returns true if name was set, false if not.
     */
    public setName(name: string): boolean {
        if (this.hasSetName) return false;
        this.name = name;
        this.hasSetName = true;
        return true;
    }

    /** Gets user settings. */
    public getSettings(): UserSettings {
        return structuredClone(this.settings);
    }

    /**
     *
     * @param setting name of the setting
     * @param value value to set the setting to.
     */
    public setSetting(
        setting: keyof UserSettings,
        value: UserSettings[typeof setting]
    ): void {
        this.settings[setting] = value;
    }
}

/** User object holding name, settings data */
export const USER = new User();

export const DEFAULT_FADE_TIME = 700;
