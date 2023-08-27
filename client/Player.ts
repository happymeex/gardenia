import Phaser from "phaser";
import { SpriteAppearance } from "./SpriteBody";
import { initializeAnimations } from "./animations";
import {
    AttackState,
    PlayerFrames,
    BasicBotFrames,
    SpriteMetaData,
    playerSpriteMetaData,
} from "./constants";

const DIRECTIONS = ["left", "right", "up", "down"] as const;
const ATTACK = "space";
const WALK_VELOCITY = 300;
const JUMP_VELOCITY = 800;
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

/**
 * Class representing a physics-obeying sprite, with methods for reading its
 * current position and appearance.
 */
class SpriteWithPhysics {
    protected readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    protected cachedAppearance: SpriteAppearance | null = null;
    protected attackState: AttackState = AttackState.READY;
    protected inAir = false;

    /**
     * Initiates a physics-obeying sprite in the given scene. Does NOT define any collider logic.
     *
     * Assumes that the spritesheet `spriteSheet` has been preloaded in the scene already.
     *
     * @param name identifier for the sprite, e.g. player's name, or NPC label, etc.
     * @param scene scene to which the sprite belongs
     * @param x initial x-coord
     * @param y initial y-coord
     * @param direction initial direction that the sprite is facing. Defaults to "right".
     */
    public constructor(
        public readonly name: string,
        readonly scene: Phaser.Scene,
        spriteData: SpriteMetaData,
        x: number,
        y: number,
        protected direction: "left" | "right" = "right"
    ) {
        this.sprite = scene.physics.add.sprite(
            x,
            y,
            spriteData.spriteSheet,
            spriteData.idleFrame
        );
        initializeAnimations(this.sprite, spriteData.spriteSheet);
        this.sprite.setSize(spriteData.width, spriteData.height);
        this.sprite.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === "attack") {
                    this.attackState = AttackState.READY;
                }
            }
        );
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    /**
     * @returns An object specifying what the player sprite should look like at the moment.
     *      If the appearance is the same as when this method was last called, returns "same".
     *      Otherwise:
     *          If `type` field is "frame", then `value` gives the spritesheet frame number.
     *          if `type` field is "anim", then `value` gives the name of the animation.
     */
    public getAppearance(): SpriteAppearance | "same" {
        const currentAnimName = this.sprite.anims.currentAnim?.key;
        let ret: SpriteAppearance;
        if (this.sprite.anims.isPlaying) {
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

class Player extends SpriteWithPhysics {
    /**
     * Initiates a player in the given scene.
     *
     * Assumes that the player spritesheet has been preloaded in the scene already.
     *
     * @param name
     * @param scene
     * @param platforms
     * @param x
     * @param y
     * @param direction initial direction that the player is facing. Defaults to "right".
     */
    public constructor(
        name: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        x: number,
        y: number,
        direction: "left" | "right" = "right"
    ) {
        super(name, scene, playerSpriteMetaData, x, y, direction);
        scene.physics.add.collider(this.sprite, platforms, this.makeCollider());
    }

    private makeCollider() {
        return (sprite: CollisionObject, platforms: CollisionObject) => {
            // silly typechecking to rule out player being tile type
            if ("body" in sprite && sprite.body.touching.down) {
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

        if (velocityX !== null) this.sprite.setVelocityX(velocityX);
        if (velocityY !== null) this.sprite.setVelocityY(velocityY);
        if (anim === "stop") {
            this.sprite.anims.stop();
            this.sprite.setFrame(frame);
        } else if (anim !== null) this.sprite.anims.play(anim, true);
        if (flipX !== null) this.sprite.setFlipX(flipX);
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

enum EnemyStates {
    WALKING,
    IDLE,
    HOMING,
    ATTACKING,
}

class HomingEnemy extends SpriteWithPhysics {
    /** Probability of transitioning from walk to pause on any given update call. */
    private readonly walkToIdleChance = 0.001;
    /** Probability of transitioning from pause to walk on any given update call. */
    private readonly IdleToWalkChance = 0.005;
    /** Indicates what the bot is "trying" to do. */
    private semanticState: EnemyStates = EnemyStates.IDLE;
    /** Bot walk speed. */
    private readonly walkspeed = 200;

    public constructor(
        name: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        spriteData: SpriteMetaData,
        x: number,
        y: number,
        direction: "left" | "right" = "right"
    ) {
        super(name, scene, spriteData, x, y, direction);
        scene.physics.add.collider(this.sprite, platforms, this.makeCollider());
    }

    private makeCollider() {
        return (sprite: CollisionObject, platforms: CollisionObject) => {
            // silly typechecking to rule out sprite being tile type
            if (!("body" in sprite)) return;
            if (sprite.body.touching.down) {
                this.inAir = false;
            }
            // turn around when hitting walls
            if (sprite.body.touching.left) {
                this.sprite.setFlipX(false);
                this.direction = "right";
                if (this.semanticState === EnemyStates.WALKING) {
                    this.sprite.setVelocityX(this.walkspeed);
                }
            } else if (sprite.body.touching.right) {
                this.sprite.setFlipX(true);
                this.direction = "left";
                if (this.semanticState === EnemyStates.WALKING) {
                    this.sprite.setVelocityX(-this.walkspeed);
                }
            }
        };
    }

    public handleMotion(homingDirection: "left" | "right" | null) {
        if (homingDirection !== null) {
            this.semanticState = EnemyStates.HOMING;
            const velocity =
                this.walkspeed * (homingDirection === "right" ? 1 : -1);
            this.sprite.setVelocityX(velocity);
            this.sprite.setFlipX(homingDirection === "left");
            this.sprite.anims.play("walk", true);
        } else {
            // If we're transitioning from homing state, go to idle
            if (this.semanticState === EnemyStates.HOMING) {
                this.semanticState = EnemyStates.IDLE;
            } else if (this.semanticState === EnemyStates.IDLE) {
                if (Math.random() < this.IdleToWalkChance) {
                    this.semanticState = EnemyStates.WALKING;
                    const velocity =
                        this.walkspeed * (this.direction === "right" ? 1 : -1);
                    this.sprite.setVelocityX(velocity);
                    this.sprite.anims.play("walk", true);
                }
            } else if (this.semanticState === EnemyStates.WALKING) {
                if (Math.random() < this.walkToIdleChance) {
                    this.semanticState = EnemyStates.IDLE;
                    this.sprite.anims.stop();
                    this.sprite.setFrame(BasicBotFrames.IDLE);
                    this.sprite.setVelocityX(0);
                }
            }
        }
    }
}

export { Player, HomingEnemy };
