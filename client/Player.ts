import Phaser from "phaser";
import { BaseSprite, CollisionObject } from "./BaseSprite";
import {
    SpriteSheet,
    playerSpriteMetaData,
    AttackState,
    HasAppearance,
    SpriteMetaData,
    AttackData,
    rockProjectileMetaData,
} from "./constants";
import { initializeAnimations } from "./animations";
import { getSpriteMetaData } from "./constants";
import { SpriteAppearance } from "./SpriteBody";
import { Pausable } from "./utils";

const MAX_MANA = 100;

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
    private mana: number = MAX_MANA;
    private processes: Map<string, number> = new Map();

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
     * @param onDeath callback executed when the player dies, right before the death animation is played.
     *      (thus, before the sprite is destroyed from the scene.)
     * @param onHealthChange callback executed when the player's health changes.
     * @param onManaChange callback executed when the player's mana changes.
     * @param onTransform callback executed when the player transforms.
     * @param direction initial direction that the player is facing. Defaults to "right".
     */
    public constructor(
        name: string,
        readonly scene: Pausable,
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
        const regenHealth = setInterval(() => {
            if (scene.scene.isActive()) {
                if (!scene.getIsPaused()) this.regenHealth(1);
            } else {
                console.log("clearing health regen");
                clearInterval(regenHealth);
            }
        }, 2500);
        const regenMana = setInterval(() => {
            if (scene.scene.isActive()) {
                if (!scene.getIsPaused()) this.updateMana(1);
            } else {
                clearInterval(regenMana);
            }
        }, 1500);
        this.processes.set("regenHealth", regenHealth);
        this.processes.set("regenMana", regenMana);
    }

    /**
     * Adds `health` to player's health, capped at `this.maxHealth`.
     *
     * @param health nonnegative value.
     */
    private regenHealth(health: number) {
        this.health = Math.min(this.health + health, this.maxHealth);
        const newRatio = this.health / this.maxHealth;
        this.onHealthChange(newRatio);
    }

    /**
     * Updates the player's mana amount, capped at 0 (lower) and `MAX_MANA` (upper).
     *
     * @param mana amount *added* to current mana. Possibly negative.
     */
    private updateMana(mana: number) {
        this.mana = Math.max(0, Math.min(this.mana + mana, MAX_MANA));
        const newRatio = this.mana / MAX_MANA;
        this.onManaChange(newRatio);
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
        for (const process of this.processes.values()) {
            clearInterval(process);
        }
        super.die();
    }

    /**
     * Moves and animates the player character appropriately given keypress data.
     *
     * @param keyData indicates which keys are currently pressed
     */
    public handleMotion(keyData: KeyData) {
        if (this.health <= 0) return;
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
            if (this.spriteData.spriteKey === SpriteSheet.FOX) {
                this.dispatchProjectile(attackData);
            } else {
                this.combatManager.processAttack(this, attackData);
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
     * Dispatches the foxes' projectile attack via the combat manager.
     * @param attackData The data of the attack.
     */
    private dispatchProjectile(attackData: AttackData) {
        const { x, y } = this.getPosition();
        const dir = this.direction === "left" ? -1 : 1;
        const teamName = this.combatManager.getTeam(this.name) ?? this.name;
        const projectile = new Projectile(
            teamName,
            this.sprite.scene,
            rockProjectileMetaData,
            x,
            y,
            this.direction,
            { vx: dir * 900, vy: 0.5 * this.sprite.body.velocity.y - 200 }
        );
        const intersectionChecker = this.combatManager.registerProjectile(
            projectile,
            projectile.name,
            attackData,
            () => onHit()
        );
        const onHit = () => {
            clearInterval(intersectionChecker);
            projectile.freeze();
            projectile.remove();
        };
    }
}

class Projectile implements HasAppearance {
    protected readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    public constructor(
        public readonly name: string,
        scene: Phaser.Scene,
        private spriteData: SpriteMetaData,
        x: number,
        y: number,
        private direction: "left" | "right",
        initialVelocity: { vx: number; vy: number }
    ) {
        this.sprite = scene.physics.add.sprite(
            x,
            y,
            spriteData.spriteKey,
            spriteData.idleFrame
        );
        const { vx, vy } = initialVelocity;
        this.sprite.setVelocity(vx, vy);
        initializeAnimations(this.sprite, this.spriteData.spriteKey);
        this.sprite.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === "break") this.sprite.destroy();
            }
        );
    }

    public getAppearance(): SpriteAppearance {
        return {
            anim: "", // TODO
            dir: this.direction,
            sprite: this.spriteData.spriteKey,
        };
    }
    public getBounds(): Phaser.Geom.Rectangle {
        const { x, y } = this.getPosition();
        return new Phaser.Geom.Rectangle(
            x - this.spriteData.width / 2,
            y - this.spriteData.height / 2,
            this.spriteData.width,
            this.spriteData.height
        );
    }
    public getPosition(): { x: number; y: number } {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    /** Sets velocity to 0 */
    public freeze() {
        this.sprite.setVelocity(0, 0);
    }

    /**
     * Plays the projectile breaking animation and then removes the sprite object
     * from the Phaser system.
     */
    public remove() {
        // TODO: animation
        this.sprite.anims.play("break");
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
