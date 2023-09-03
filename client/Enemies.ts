import Phaser from "phaser";
import { BaseSprite, CollisionObject } from "./BaseSprite";
import {
    SpriteMetaData,
    AttackState,
    basicBotSpriteMetaData,
} from "./constants";
enum EnemyStates {
    WALKING,
    IDLE,
    HOMING,
    ATTACKING,
}

class HomingEnemy extends BaseSprite {
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
        super(name, scene, spriteData, x, y, onDeath, direction);
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
        this.sprite.setFrame(basicBotSpriteMetaData.idleFrame);
        this.sprite.setVelocityX(0);
    }

    public attack() {
        this.sprite.setVelocityX(0);
        this.attackState = AttackState.ATTACKING;
        this.sprite.anims.play("attack", true);
    }
}

export { HomingEnemy };
