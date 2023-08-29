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
}

/** Shorthands for message types. */
export enum MsgTypes {
    /** For data containing a sprite's position and appearance. */
    SPRITE = "s",
}

// player constants

export enum AttackState {
    ATTACKING,
    READY,
}

export enum PlayerFrames {
    IDLE = 27,
    /** Mugshot for use in healthbar/status UI. */
    ICON = 30,
}

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
