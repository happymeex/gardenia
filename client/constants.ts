export const CANVAS_WIDTH = 1344;
export const CANVAS_HEIGHT = 756;
export const CANVAS_CENTER = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2] as const;

// spritesheet keys

export enum SpriteSheet {
    PLAYER = "player",
    BASIC_BOT = "basic-bot",
    PLATFORM = "platform",
    WATERFALL = "waterfall-bg",
}

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

export enum PlayerFrames {
    IDLE = 27,
    /** Mugshot for use in healthbar/status UI. */
    ICON = 30,
}

export const PLAYER_DEFAULT_HEALTH = 100;
export const PLAYER_PUNCH_DMG = 15;
export const PLAYER_UPPERCUT_DMG = 20;
export const PLAYER_KICK_DMG = 25;
export const BASIC_BOT_HEALTH = 25;
export const BASIC_BOT_DMG = 10;

export enum BasicBotFrames {
    IDLE = 18,
}

export interface SpriteMetaData {
    readonly spriteSheet: SpriteSheet;
    readonly width: number;
    readonly height: number;
    readonly idleFrame: number;
}

export const playerSpriteMetaData: SpriteMetaData = {
    spriteSheet: SpriteSheet.PLAYER,
    width: 64,
    height: 105,
    idleFrame: PlayerFrames.IDLE,
};

export const basicBotSpriteMetaData: SpriteMetaData = {
    spriteSheet: SpriteSheet.BASIC_BOT,
    width: 52,
    height: 105,
    idleFrame: BasicBotFrames.IDLE,
};

export interface CanBeHit {
    name: string;
    getPosition(): { x: number; y: number };
    getBounds(): Phaser.Geom.Rectangle;
    takeDamage(dmg: number): void;
}

export interface HasHealth extends CanBeHit {
    getHealthPercentage(): number;
}
