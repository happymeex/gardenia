export const CANVAS_WIDTH = 1344;
export const CANVAS_HEIGHT = 756;
export const CANVAS_CENTER = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2] as const;

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

export enum AttackState {
    ATTACKING,
    READY,
}