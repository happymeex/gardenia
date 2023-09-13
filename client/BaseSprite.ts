import Phaser from "phaser";
import { SpriteAppearance } from "./SpriteBody";
import { initializeAnimations } from "./animations";
import {
    AttackState,
    SpriteMetaData,
    HasHealth,
    Sound,
    soundTracks,
} from "./constants";
import { USER } from "./User";
import { flashWhite } from "./utils";
import {
    CombatManager,
    NullCombatManager,
    ICombatManager,
} from "./CombatManager";

export type CollisionObject =
    | Phaser.Types.Physics.Arcade.GameObjectWithBody
    | Phaser.Tilemaps.Tile;

/**
 * Class representing a physics-obeying sprite, with methods for reading its
 * current position and appearance.
 */
export class BaseSprite implements HasHealth {
    protected readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    protected attackState: AttackState = AttackState.READY;
    protected inAir = false;
    protected combatManager: ICombatManager = new NullCombatManager();
    protected health: number;
    protected readonly maxHealth: number;

    /**
     * Initiates a physics-obeying sprite in the given scene. Does NOT define any collider logic.
     *
     * Assumes that the spritesheet `spriteSheet` has been preloaded in the scene already.
     *
     * @param name identifier for the sprite, e.g. player's name, or NPC label, etc.
     * @param scene scene to which the sprite belongs
     * @param x initial x-coord
     * @param y initial y-coord
     * @param direction initial direction that the sprite is facing.
     */
    public constructor(
        public readonly name: string,
        scene: Phaser.Scene,
        protected spriteData: SpriteMetaData,
        x: number,
        y: number,
        private onDeath: (name: string) => void,
        protected direction: "left" | "right"
    ) {
        this.health = spriteData.health;
        this.maxHealth = spriteData.health;
        this.sprite = scene.physics.add.sprite(
            x,
            y,
            spriteData.spriteKey,
            spriteData.idleFrame
        );
        if (direction === "left") this.sprite.setFlipX(true);
        initializeAnimations(this.sprite, spriteData.spriteKey);
        this.sprite.setSize(spriteData.width, spriteData.height);
        this.sprite.on(
            "animationcomplete",
            (e: Phaser.Animations.Animation) => {
                if (e.key === "death") {
                    this.onDeath(this.name);
                    this.sprite.destroy();
                }
            }
        );
    }

    /**
     * Deals damage to the character and flashes the sprite white to indicate so.
     * Calls `die` method if health becomes nonpositive.
     * Does nothing if called when health is already nonpositive.
     *
     * @param dmg amount of damage dealt by incoming attack. (The actual amount of damage
     *      taken is computed based on the defense multiplier stat.)
     */
    public takeDamage(dmg: number) {
        if (this.health <= 0) return;
        flashWhite(this.sprite);
        this.health -= this.spriteData.defenseMultiplier * dmg;
        if (this.health <= 0) this.die();
    }

    /**
     * Plays a sound immediately if the user has sound fx turned on. Otherwise does nothing.
     *
     * @param sound
     * @returns
     */
    protected playSound(sound: Sound): void {
        if (!this.sprite.scene || !USER.getSettings().soundFX) return;
        const soundData = soundTracks.get(sound);
        if (soundData !== undefined) {
            this.sprite.scene.sound.add(soundData.key, soundData.config).play();
        }
    }

    /**
     * Freezes sprite horizontally and plays the death animation.
     * The `onDeath` method passed into the constructor will be called
     * immediately after the animation ends, right before destroying the sprite from the scene.
     */
    public die() {
        this.sprite.setVelocityX(0);
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
     */
    public getAppearance(): SpriteAppearance {
        const currentAnimName = this.sprite.anims.currentAnim?.key;
        if (currentAnimName === undefined)
            throw new Error(
                "Unexpected undefined animation name despite animation playing"
            );
        const ret: SpriteAppearance = {
            anim: currentAnimName,
            dir: this.direction,
            sprite: this.spriteData.spriteKey,
        };
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
