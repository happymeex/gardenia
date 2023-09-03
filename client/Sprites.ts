import Phaser from "phaser";
import { SpriteAppearance } from "./SpriteBody";
import { initializeAnimations } from "./animations";
import {
    AttackState,
    PlayerFrames,
    BasicBotFrames,
    SpriteMetaData,
    playerSpriteMetaData,
    BASIC_BOT_DMG,
    BASIC_BOT_HEALTH,
    PLAYER_DEFAULT_HEALTH,
    HasHealth,
    SpriteSheet,
    getSpriteMetaData,
} from "./constants";
import { flashWhite } from "./utils";
import CombatManager from "./CombatManager";

const DIRECTIONS = ["left", "right", "up", "down"] as const;
const ATTACK = "space";
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
class SpriteWithPhysics implements HasHealth {
    protected readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    protected cachedAppearance: SpriteAppearance | null = null;
    protected attackState: AttackState = AttackState.READY;
    protected inAir = false;
    protected combatManager: CombatManager | null = null;
    protected maxHealth: number;

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
        scene: Phaser.Scene,
        protected spriteData: SpriteMetaData,
        x: number,
        y: number,
        protected health: number,
        private onDeath: (name: string) => void,
        protected direction: "left" | "right" = "right"
    ) {
        this.maxHealth = health;
        this.sprite = scene.physics.add.sprite(
            x,
            y,
            spriteData.spriteKey,
            spriteData.idleFrame
        );
        initializeAnimations(this.sprite, spriteData.spriteKey);
        this.sprite.setSize(spriteData.width, spriteData.height);
        this.sprite.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === "death") {
                    this.sprite.destroy();
                }
            }
        );
    }

    /**
     * Deals `dmg` damage to the character and flashes the sprite white to indicate so.
     * Calls `die` method if health becomes nonpositive.
     * Does nothing if called when health is already nonpositive.
     *
     * @param dmg amount of damage taken
     */
    public takeDamage(dmg: number) {
        if (this.health <= 0) return;
        flashWhite(this.sprite);
        this.health -= dmg;
        if (this.health <= 0) this.die();
    }

    /**
     * Freezes sprite horizontally, calls the `onDeath` method passed into the constructor,
     * plays the death animation, and then destroys the sprite from the scene.
     */
    public die() {
        this.sprite.setVelocityX(0);
        this.onDeath(this.name);
        this.sprite.anims.play("death");
        console.log(this.name, "died");
    }

    /**
     * @returns A value between 0 and 1 representing this entity's remaining health percentage.
     */
    public getHealthPercentage(): number {
        return Math.max(this.health / this.maxHealth, 0);
    }

    /**
     * Attaches a combat manager to coordinate transmission and receival of attacks
     * between scene combatants. After the combat manager is attached, other combatants
     * can be hit by this player's attacks.
     *
     * @param combatManager
     * @param team string used to determine which combatants should be able to hit which
     *      others. Friendly fire is disallowed.
     * @param onHit optional callback executed when this player is hit, immediately after
     *      its `takeDamage` method is called.
     */
    public registerAsCombatant(
        combatManager: CombatManager,
        team: string,
        onHit?: (dmg: number) => void
    ) {
        combatManager.addParticipant(this, team, onHit);
        this.combatManager = combatManager;
    }

    /**
     * @returns coordinates of the center of the sprite's (physics/hitbox) rectangle bounds
     */
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
            if (currentAnimName === undefined)
                throw new Error(
                    "Unexpected undefined animation name despite animation playing"
                );
            ret = {
                type: "anim",
                value: currentAnimName,
                direction: this.direction,
            };
        } else {
            ret = {
                type: "frame",
                value: String(PlayerFrames.IDLE),
                direction: this.direction,
            };
        }
        if (
            this.cachedAppearance &&
            ret.type === this.cachedAppearance.type &&
            ret.value === this.cachedAppearance.value &&
            ret.direction === this.cachedAppearance.direction
        ) {
            return "same";
        }
        this.cachedAppearance = ret;
        return ret;
    }

    /**
     * @returns Rectangle object representing the sprite's bounds (with dimensions as specified in
     *      the `spriteData` parameter passed to the constructor)
     */
    public getBounds(): Phaser.Geom.Rectangle {
        const { x, y } = this.getPosition();
        return new Phaser.Geom.Rectangle(
            x - this.spriteData.width / 2,
            y - this.spriteData.width / 2,
            this.spriteData.width,
            this.spriteData.height
        );
    }
}

class Player extends SpriteWithPhysics {
    /**
     * Initiates a player-controlled sprite in the given scene.
     *
     * Assumes that the player spritesheet has been preloaded in the scene already.
     *
     * @param name
     * @param scene
     * @param platforms
     * @param x initial x-coordinate
     * @param y initial y-coordinate
     * @param onDeath callback executed when the player dies, before the sprite is destroyed from the scene.
     * @param onHealthChange callback executed when the player's health changes.
     * @param onManaChange callback executed when the player's mana changes.
     * @param direction initial direction that the player is facing. Defaults to "right".
     */
    public constructor(
        name: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        x: number,
        y: number,
        onDeath: (name: string) => void,
        private onHealthChange: (ratio: number) => void,
        private onManaChange: (ratio: number) => void,
        private onTransform: (target: SpriteSheet) => void,
        direction: "left" | "right" = "right"
    ) {
        super(
            name,
            scene,
            playerSpriteMetaData,
            x,
            y,
            PLAYER_DEFAULT_HEALTH,
            onDeath,
            direction
        );
        scene.physics.add.collider(this.sprite, platforms, this.makeCollider());
        initializeAnimations(this.sprite, SpriteSheet.FOX, SpriteSheet.BEAR);
        this.sprite.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === `${this.spriteData.spriteKey}-attack`)
                    this.attackState = AttackState.READY;
            }
        );
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
     * Adjusts the healthbar UI accordingly.
     * @inheritdoc
     */
    public takeDamage(dmg: number) {
        const newRatio = Math.max((this.health - dmg) / this.maxHealth, 0);
        this.onHealthChange(newRatio);
        super.takeDamage(dmg);
    }

    /**
     * Transforms the player sprite back to human form first before playing the death animation.
     * @inheritdoc
     */
    public die() {
        this.transform(SpriteSheet.PLAYER);
        super.die();
    }

    /**
     * Moves and animates the player character appropriately given keypress data.
     *
     * @param keyData indicates which keys are currently pressed
     */
    public handleMotion(keyData: KeyData) {
        const {
            spriteKey: spriteSheet,
            walkSpeed,
            jumpVelocity,
            attackData,
        } = this.spriteData;
        // null indicates no change
        let anim: string | null = null,
            velocityX: number | null = null,
            velocityY: number | null = null,
            flipX: boolean | null = null;
        const horizontal: ("left" | "right")[][] = [
            ["left", "right"],
            ["right", "left"],
        ];
        if (keyData[ATTACK] && this.attackState === AttackState.READY) {
            anim = `${spriteSheet}-attack`;
            this.attackState = AttackState.ATTACKING;
            if (this.combatManager !== null) {
                this.combatManager.processAttack(this, attackData);
            }
            if (this.spriteData.spriteKey === SpriteSheet.FOX) {
                this.dispatchProjectile();
            }
            if (!this.inAir) velocityX = 0;
        } else if (this.attackState !== AttackState.ATTACKING) {
            if (keyData.up) {
                if (!this.inAir) {
                    velocityY = -jumpVelocity;
                    this.inAir = true;
                    anim = `${spriteSheet}-jump`;
                }
            }
            for (const [dir, opposite] of horizontal) {
                if (keyData[dir]) {
                    if (this.direction === opposite) {
                        flipX = dir === "left"; // sprites are right-facing by default
                        this.direction = dir;
                    }
                    if (!this.inAir) anim = `${spriteSheet}-walk`;
                    velocityX = walkSpeed * (dir === "right" ? 1 : -1);
                }
            }
            if (anim === null) {
                if (!this.inAir) {
                    velocityX = 0;
                    anim = `${spriteSheet}-idle`;
                } else anim = `${spriteSheet}-jump`;
            }
        }

        if (velocityX !== null) this.sprite.setVelocityX(velocityX);
        if (velocityY !== null) this.sprite.setVelocityY(velocityY);
        if (anim !== null) this.sprite.anims.play(anim, true);
        if (flipX !== null) this.sprite.setFlipX(flipX);
    }

    public transform(target: SpriteSheet) {
        // note: when Phaser swaps the sprite's texture, it preserves
        // the center of the bounding box
        const newMetaData = getSpriteMetaData(target);
        // vertical displacement so that feet of new sprite align with feet of old
        const dy = (newMetaData.height - this.spriteData.height) / 2;
        this.spriteData = newMetaData;
        this.sprite.setTexture(target);
        this.sprite.setSize(newMetaData.width, newMetaData.height);
        this.sprite.y -= dy;
        this.sprite.setFrame(newMetaData.idleFrame);
        this.onTransform(target);
    }
    /**
     * For the foxes' ranged attack.
     */
    private dispatchProjectile() {
        const { x, y } = this.getPosition();
        const projectile = this.scene.physics.add.sprite(
            x,
            y,
            SpriteSheet.ICONS,
            3
        );
        const { x: vx, y: vy } = this.sprite.body.velocity;
        const dir = this.direction === "left" ? -1 : 1;
        projectile.setVelocity(dir * (vx + 900), vy - 200);
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

    /**
     * Creates an non-player-controlled enemy that wanders around,
     * walking straight and pausing at random intervals,
     * only turning when it hits a wall. If given the signal, it can be instructed to walk
     * in a given direction and attack a given player character.
     *
     * @param name Must be unique among sprites (players, enemies, ...) in the scene.
     * @param scene Scene to which this enemy belongs.
     * @param platforms
     * @param spriteData
     * @param x Initial x-coordinate.
     * @param y Initial y-coordinate.
     * @param onDeath Handler function that will be run on death (right before death animation).
     *      Use this to remove any references to this object.
     * @param direction Initial direction that the enemy faces. Defaults to "right".
     */
    public constructor(
        name: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        spriteData: SpriteMetaData,
        x: number,
        y: number,
        onDeath: (name: string) => void,
        direction: "left" | "right" = "right"
    ) {
        super(
            name,
            scene,
            spriteData,
            x,
            y,
            BASIC_BOT_HEALTH,
            onDeath,
            direction
        );
        scene.physics.add.collider(this.sprite, platforms, this.makeCollider());
        this.sprite.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === "attack") {
                    if (this.combatManager) {
                        this.combatManager.processAttack(
                            this,
                            this.spriteData.attackData
                        );
                    }
                    this.attackState = AttackState.READY;
                }
            }
        );
    }

    /**
     * @returns a handler function for collisions (contact) between this enemy and
     *      the platforms in the scene. In particular, the enemy turns around when it hits a wall.
     */
    private makeCollider(): Phaser.Types.Physics.Arcade.ArcadePhysicsCallback {
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
                    this.sprite.setVelocityX(this.spriteData.walkSpeed);
                }
            } else if (sprite.body.touching.right) {
                this.sprite.setFlipX(true);
                this.direction = "left";
                if (this.semanticState === EnemyStates.WALKING) {
                    this.sprite.setVelocityX(-this.spriteData.walkSpeed);
                }
            }
        };
    }

    /**
     * Call this method with scene-update frequency to move and animate this
     * enemy appropriately.
     *
     * If `homingDirection` is not null, then the enemy will move in the specified direction.
     * TODO: configure attacks. Should they be controlled within this class or externally?
     *
     * If walking, then stops with some fixed probability, and if stopped,
     * starts walking with some different fixed probability.
     *
     * @param homingDirection specifies a direction of movement; if left `null`, then the
     *      enemy continues walking/idling.
     */
    public handleMotion(homingDirection: "left" | "right" | null) {
        if (this.attackState === AttackState.ATTACKING) return;
        if (homingDirection !== null) {
            this.semanticState = EnemyStates.HOMING;
            const velocity =
                this.spriteData.walkSpeed *
                (homingDirection === "right" ? 1 : -1);
            this.sprite.setVelocityX(velocity);
            this.sprite.setFlipX(homingDirection === "left");
            this.direction = homingDirection;
            this.sprite.anims.play("walk", true);
        } else {
            // If we're transitioning from homing state, go to idle
            if (this.semanticState === EnemyStates.HOMING) {
                this.setIdle();
            } else if (this.semanticState === EnemyStates.IDLE) {
                if (Math.random() < this.IdleToWalkChance) {
                    this.semanticState = EnemyStates.WALKING;
                    const velocity =
                        this.spriteData.walkSpeed *
                        (this.direction === "right" ? 1 : -1);
                    this.sprite.setVelocityX(velocity);
                    this.sprite.anims.play("walk", true);
                }
            } else if (this.semanticState === EnemyStates.WALKING) {
                if (Math.random() < this.walkToIdleChance) {
                    this.setIdle();
                }
            }
        }
    }

    private setIdle() {
        this.semanticState = EnemyStates.IDLE;
        this.sprite.anims.stop();
        this.sprite.setFrame(BasicBotFrames.IDLE);
        this.sprite.setVelocityX(0);
    }

    public attack() {
        this.sprite.setVelocityX(0);
        this.attackState = AttackState.ATTACKING;
        this.sprite.anims.play("attack", true);
    }
}

export { Player, HomingEnemy };
