import Phaser from "phaser";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import { SpriteAppearance } from "./SpriteBody";
import { initializeAnimations } from "./animations";
import { AttackState, PlayerFrames } from "./constants";

const SPRITE_SIZE = 128; // square sprites
const DIRECTIONS = ["left", "right", "up", "down"] as const;
const ATTACK = "space";
const WALK_VELOCITY = 300;
const JUMP_VELOCITY = 800;
const HITBOX_WIDTH = 64;
const HITBOX_HEIGHT = 105;
type CollisionObject =
    | Phaser.Types.Physics.Arcade.GameObjectWithBody
    | Phaser.Tilemaps.Tile;

export type KeyData = {
    [K in (typeof DIRECTIONS)[number] | typeof ATTACK]: boolean;
};
export const NO_KEYS_PRESSED: KeyData = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
};

class Player {
    private readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cachedAppearance: SpriteAppearance | null = null;
    private attackState: AttackState = AttackState.READY;
    public constructor(
        public readonly name: string,
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
            PlayerFrames.IDLE
        );
        this.player.setCollideWorldBounds(true);
        initializeAnimations(scene, this.player, "player");
        scene.physics.add.collider(this.player, platforms, this.makeCollider());
        this.player.setSize(HITBOX_WIDTH, HITBOX_HEIGHT);
        this.player.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === "attack") {
                    this.attackState = AttackState.READY;
                }
            }
        );
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
     * @param keyData indicates which keys are currently pressed
     */
    public handleMotion(keyData: KeyData) {
        // null indicates no change
        let anim: string | null = null,
            velocityX: number | null = null,
            velocityY: number | null = null,
            flipX: boolean | null = null,
            frame: PlayerFrames | null = null;
        const horizontal: ("left" | "right")[][] = [
            ["left", "right"],
            ["right", "left"],
        ];
        if (keyData[ATTACK] && this.attackState === AttackState.READY) {
            anim = "attack";
            this.attackState = AttackState.ATTACKING;
            if (!this.inAir) velocityX = 0;
        } else if (keyData.up) {
            if (!this.inAir) {
                velocityY = -JUMP_VELOCITY;
                this.inAir = true;
            }
        }
        for (const [dir, opposite] of horizontal) {
            if (keyData[dir] && this.attackState !== AttackState.ATTACKING) {
                if (this.direction === opposite) {
                    flipX = dir === "left"; // sprites are right-facing by default
                    this.direction = dir;
                }
                if (!this.inAir) anim = "walk";
                velocityX = WALK_VELOCITY * (dir === "right" ? 1 : -1);
            }
        }
        if (anim === null && this.attackState !== AttackState.ATTACKING) {
            if (!this.inAir) velocityX = 0;
            anim = "stop";
            frame = PlayerFrames.IDLE;
        }

        if (velocityX !== null) this.player.setVelocityX(velocityX);
        if (velocityY !== null) this.player.setVelocityY(velocityY);
        if (anim === "stop") {
            this.player.anims.stop();
            this.player.setFrame(frame);
        } else if (anim !== null) this.player.anims.play(anim, true);
        if (flipX !== null) this.player.setFlipX(flipX);
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
                value: String(PlayerFrames.IDLE),
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
 * Utility function for extracting keypress information regarding the arrow keys and the space bar.
 *
 * @param cursors
 * @returns object with fields corresponding to the four directions, whose values
 *      are booleans indicating whether or not that key is currently pressed
 */
export function getMotions(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
): KeyData {
    const ret: KeyData = {
        ...NO_KEYS_PRESSED,
    };
    DIRECTIONS.forEach((dir) => {
        ret[dir] = cursors[dir].isDown;
    });
    ret[ATTACK] = cursors[ATTACK].isDown;
    return ret;
}

export default Player;
