import Phaser from "phaser";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import { SpriteAppearance } from "./SpriteBody";
import { initializeAnimations } from "./animations";

const SPRITE_SIZE = 128; // square sprites
const DIRECTIONS = ["left", "right", "up", "down"] as const;
const WALK_FRAME_RATE = 12;
const WALK_VELOCITY = 450;
const JUMP_VELOCITY = 800;
const HITBOX_WIDTH = 64;
const HITBOX_HEIGHT = 105;
type CollisionObject =
    | Phaser.Types.Physics.Arcade.GameObjectWithBody
    | Phaser.Tilemaps.Tile;

enum playerFrames {
    IDLE = 27,
}

export type KeyData = { [K in (typeof DIRECTIONS)[number]]: boolean };
export const NO_KEYS_PRESSED: KeyData = {
    left: false,
    right: false,
    up: false,
    down: false,
};

class Player {
    private readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cachedAppearance: SpriteAppearance | null = null;
    public constructor(
        public readonly key: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        locationX: number,
        locationY: number,
        private direction: "left" | "right" = "right",
        private inAir: boolean = false
    ) {
        if (!scene.textures.exists("player")) {
            scene.load.spritesheet("player", playerSpritesheet, {
                frameWidth: SPRITE_SIZE,
                frameHeight: SPRITE_SIZE,
            });
        }
        this.player = scene.physics.add.sprite(
            locationX,
            locationY,
            "player",
            playerFrames.IDLE
        );
        this.player.setCollideWorldBounds(true);
        initializeAnimations(scene, this.player, "player");
        scene.physics.add.collider(this.player, platforms, this.makeCollider());
        this.player.setSize(HITBOX_WIDTH, HITBOX_HEIGHT);
    }

    /**
     * Forcefully moves the player to the given position while preserving velocity.
     *
     * @param x x-coordinate of new position
     * @param y y-coordinate of new position
     */
    public updatePosition(x: number, y: number) {
        //this.player.body.moves = false;
        this.player.x = x;
        this.player.y = y;
        //this.player.body.moves = true;
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.player.x, y: this.player.y };
    }

    private makeCollider() {
        return (player: CollisionObject, platforms: CollisionObject) => {
            // silly typechecking to rule out player being tile type
            if ("body" in player && player.body.touching.down) {
                this.inAir = false;
            }
        };
    }

    /**
     * Moves and animates the player character appropriately given keypress data.
     *
     * @param dirs indicates which keys are currently pressed
     */
    public handleMotion(dirs: KeyData) {
        let noAnim = false;
        if (dirs.up) {
            if (!this.inAir) {
                this.player.anims.stop();
                noAnim = true;
                this.player.setVelocityY(-JUMP_VELOCITY);
                this.inAir = true;
            }
        }
        if (dirs.left) {
            if (this.direction === "right") {
                this.player.setFlipX(true);
            }
            this.direction = "left";
            this.player.setVelocityX(-WALK_VELOCITY);
            if (!this.inAir) this.player.anims.play("walk", true);
            else noAnim = true;
        } else if (dirs.right) {
            if (this.direction === "left") {
                this.player.setFlipX(false);
            }
            this.direction = "right";
            this.player.setVelocityX(WALK_VELOCITY);
            if (!this.inAir) this.player.anims.play("walk", true);
            else noAnim = true;
        } else {
            this.player.setVelocityX(0);
            this.player.anims.stop(); // temporary; will replace with idle animation later
            noAnim = true;
        }
        if (noAnim) this.player.setFrame(playerFrames.IDLE);
    }

    /**
     * @returns An object specifying what the player sprite should look like at the moment.
     *      If the appearance is the same as when this method was last called, returns "same".
     *      Otherwise:
     *          If `type` field is "frame", then `value` gives the spritesheet frame number.
     *          if `type` field is "anim", then `value` gives the name of the animation.
     */
    public getAppearance(): SpriteAppearance | "same" {
        const currentAnimName = this.player.anims.currentAnim?.key;
        let ret: SpriteAppearance;
        if (this.player.anims.isPlaying) {
            ret = { type: "anim", value: currentAnimName };
        } else {
            ret = {
                type: "frame",
                value: String(playerFrames[this.direction]),
            };
        }
        if (
            this.cachedAppearance &&
            ret.type === this.cachedAppearance.type &&
            ret.value === this.cachedAppearance.value
        ) {
            return "same";
        }
        this.cachedAppearance = ret;
        return ret;
    }
}

/**
 * Utility function for extracting directional keypress information.
 *
 * @param cursors
 * @returns object with fields corresponding to the four directions, whose values
 *      are booleans indicating whether or not that key is currently pressed
 */
export function getMotions(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
): KeyData {
    const ret = { up: false, down: false, left: false, right: false };
    DIRECTIONS.forEach((dir) => {
        ret[dir] = cursors[dir].isDown;
    });
    return ret;
}

export default Player;
