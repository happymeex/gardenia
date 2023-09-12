import Phaser from "phaser";
import { BaseSprite, CollisionObject } from "./BaseSprite";
import {
    AttackState,
    basicBotSpriteMetaData,
    bombBotMetaData,
    HasLocation,
    Sound,
} from "./constants";
enum EnemyStates {
    WALKING,
    IDLE,
    HOMING,
}

class BasicBot extends BaseSprite implements Enemy {
    /** Probability of transitioning from walk to pause on any given update call. */
    private walkToIdleChance = 0.001;
    /** Probability of transitioning from pause to walk on any given update call. */
    private IdleToWalkChance = 0.005;
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
        x: number,
        y: number,
        onDeath: (name: string) => void,
        direction: "left" | "right" = "right"
    ) {
        super(name, scene, basicBotSpriteMetaData, x, y, onDeath, direction);
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

    public handleMotion(homingDirection: "left" | "right" | null) {
        if (this.health <= 0) return;
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
        this.sprite.setFrame(basicBotSpriteMetaData.idleFrame);
        this.sprite.setVelocityX(0);
    }

    /**
     * Sets x-velocity to 0, makes enemy attack, plays attack animation.
     * Does nothing if this enemy is already dead.
     */
    public attack(): void {
        if (this.health <= 0) return;
        this.sprite.setVelocityX(0);
        this.attackState = AttackState.ATTACKING;
        this.sprite.anims.play("attack", true);
    }

    /**
     * Plays a damage sound effect.
     * @inheritdoc
     * @param dmg
     */
    public takeDamage(dmg: number): void {
        super.takeDamage(dmg);
        this.playSound(Sound.DAMAGE);
    }
}

class BombBot extends BaseSprite implements Enemy {
    private semanticState = EnemyStates.WALKING;
    public constructor(
        name: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        x: number,
        y: number,
        onDeath: (name: string) => void,
        direction: "left" | "right" = "right"
    ) {
        super(name, scene, bombBotMetaData, x, y, onDeath, direction);
        scene.physics.add.collider(this.sprite, platforms, this.makeCollider());
        const velocity =
            this.spriteData.walkSpeed * (this.direction === "right" ? 1 : -1);
        this.sprite.setVelocityX(velocity);
        this.sprite.anims.play("walk", true);
        this.sprite.setOffset(22, 38);
    }

    /**
     * Plays a damage sound effect.
     * @inheritdoc
     * @param dmg
     */
    public takeDamage(dmg: number): void {
        super.takeDamage(dmg);
        this.playSound(Sound.EXPLODE); // bomb bot dies when any damage is taken
    }

    public attack() {
        if (this.attackState === AttackState.ATTACKING) return;
        this.attackState = AttackState.ATTACKING;
        this.sprite.setVelocity(0);
        this.sprite.anims.play("death");
        this.combatManager.processAttack(this, this.spriteData.attackData);
        this.playSound(Sound.EXPLODE);
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
     * enemy appropriately. Does nothing if this enemy has already died.
     *
     * If `homingDirection` is not null, then the enemy will move in the specified direction.
     *
     * If walking, then stops with some fixed probability, and if stopped,
     * starts walking with some different fixed probability.
     *
     * @param homingDirection specifies a direction of movement; if left `null`, then the
     *      enemy continues walking/idling.
     */
    public handleMotion(homingDirection: "left" | "right" | null) {
        if (this.health <= 0) return;
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
                //
                const velocity =
                    this.spriteData.walkSpeed *
                    (this.direction === "right" ? 1 : -1);
                this.sprite.setVelocityX(velocity);
                this.sprite.anims.play("walk", true);
            }
        }
    }
}

interface Enemy extends HasLocation {
    name: string;
    /**
     * Call this method with scene-update frequency to move and animate this
     * enemy appropriately. Does nothing if this enemy has already died.
     *
     * If `homingDirection` is not null, then the enemy will move in the specified direction.
     *
     * If walking, then stops with some fixed probability, and if stopped,
     * starts walking with some different fixed probability.
     *
     * @param homingDirection specifies a direction of movement; if left `null`, then the
     *      enemy continues walking/idling.
     */
    handleMotion(homingDirection: "left" | "right" | null): void;
    /**
     * Initiates the enemy's attack animation and transmits the attack to the target via
     * a combat manager. The timing of the latter relative to the former may vary based
     * on the type of enemy.
     */
    attack(): void;
    getBounds(): Phaser.Geom.Rectangle;
    getPosition(): { x: number; y: number };
}
export { Enemy, BasicBot, BombBot };
