import Phaser from "phaser";
import { BaseSprite, CollisionObject } from "./BaseSprite";
import { SpriteSheet, playerSpriteMetaData, AttackState } from "./constants";
import { initializeAnimations } from "./animations";
import { getSpriteMetaData } from "./constants";

const DIRECTIONS = ["left", "right", "up", "down"] as const;
const ATTACK = "space";
type KeyData = {
    [K in (typeof DIRECTIONS)[number] | typeof ATTACK]: boolean;
};

const NO_KEYS_PRESSED: KeyData = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
};

class Player extends BaseSprite {
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
     * @param onTransform callback executed when the player transforms.
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
        super(name, scene, playerSpriteMetaData, x, y, onDeath, direction);
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

export { Player };
