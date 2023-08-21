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
