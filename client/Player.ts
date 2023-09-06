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
import { BattleScene } from "./utils";

const MAX_MANA = 100;
/** Prefix string for all projectile names. */
const PROJECTILE_PREFIX = "*PRJCT";

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
    private numProjectiles = 0;

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
        readonly scene: BattleScene,
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

    /**
     * If the player is attacking, does nothing. Otherwise, changes the sprite
     * to the one corresponding to `target`, shifts the sprite vertically so that
     * its feet level stays constant, sets the frame to the idle frame
     * specified in the spritesheet metadata of `target`, and finally calls `this.onTransform`.
     *
     * @param target the key of the spritesheet to transform to
     * @returns true if the transformation occurs, false otherwise
     */
    public transform(target: SpriteSheet): boolean {
        if (this.attackState === AttackState.ATTACKING) return false;
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
        return true;
    }

    /**
     * Dispatches the foxes' projectile attack via the combat manager.
     * @param attackData The data of the attack.
     */
    private dispatchProjectile(attackData: AttackData) {
        const { x, y } = this.getPosition();
        const dir = this.direction === "left" ? -1 : 1;
        const projectileName = `${PROJECTILE_PREFIX}-${this.name}-${this.numProjectiles}`;
        const teamName = this.combatManager.getTeam(this.name) ?? this.name;
        const projectile = new Projectile(
            projectileName,
            this.sprite.scene,
            SpriteSheet.ROCK_PROJECTILE,
            x,
            y,
            this.direction,
            { vx: dir * 900, vy: 0.5 * this.sprite.body.velocity.y - 200 }
        );
        const intersectionChecker = this.combatManager.registerProjectile(
            projectile,
            teamName,
            attackData,
            () => onHit()
        );
        const onHit = () => {
            projectile.freeze();
            projectile.remove(() => {
                this.combatManager.getProjectileHandlers().onRemove(projectile);
                clearInterval(intersectionChecker);
            });
        };
        this.numProjectiles++;
        this.scene.addProcess(projectileName, intersectionChecker);
    }
}

export class Projectile implements HasAppearance {
    protected readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private onDestroy = () => {};
    private spriteData: SpriteMetaData;
    public constructor(
        public readonly name: string,
        scene: Phaser.Scene,
        public readonly spriteKey: SpriteSheet,
        x: number,
        y: number,
        public direction: "left" | "right",
        public initialVelocity: { vx: number; vy: number }
    ) {
        const spriteData = getSpriteMetaData(spriteKey);
        this.spriteData = spriteData;
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
                if (e.key === "break") {
                    this.onDestroy();
                    this.sprite.destroy();
                }
            }
        );
    }

    public getAppearance(): SpriteAppearance {
        const animName = this.sprite.anims.currentAnim?.key;
        return {
            anim: animName === undefined ? "idle" : animName,
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

    /** Sets velocity to 0 and disables physics on the projectile. */
    public freeze() {
        this.sprite.setVelocity(0, 0);
        this.sprite.disableBody();
    }

    /**
     * Plays the projectile breaking animation and then removes the sprite object
     * from the Phaser system.
     * @param onDestroy Optional callback function executed after the death animation has finished,
     *      right before destroying the sprite.
     */
    public remove(onDestroy?: () => void) {
        if (onDestroy) this.onDestroy = onDestroy;
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
