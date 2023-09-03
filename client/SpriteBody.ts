import Phaser from "phaser";
import { initializeAnimations } from "./animations";
import {
    SpriteSheet,
    playerSpriteMetaData,
    CanBeHit,
    SpriteMetaData,
    getSpriteMetaData,
} from "./constants";
import { flashWhite } from "./utils";

export type SpriteAppearance = {
    anim: string;
    dir: "left" | "right";
    sprite: SpriteSheet;
};

class SpriteBody implements CanBeHit {
    private readonly sprite: Phaser.GameObjects.Sprite;
    /**
     * Instantiates a sprite in the given scene. The sprite does not carry
     * logic for moving, attacking, or maintaining health; its appearance on-screen
     * must be dictated by external data via its `setPosition` and `setAppearance` methods.
     *
     * @param name id for this sprite body
     * @param scene
     * @param spriteData metadata for the initial state
     * @param spriteKeys list of spritesheets (in addition to the one included in `spriteData`)
     *      for which animations should be loaded.
     * @param x initial x-coordinate
     * @param y initial y-coordinate
     * @param initialFrame
     */
    public constructor(
        public readonly name: string,
        scene: Phaser.Scene,
        private spriteData: SpriteMetaData,
        spriteKeys: SpriteSheet[],
        x: number,
        y: number,
        initialFrame = 0
    ) {
        this.sprite = scene.add.sprite(
            x,
            y,
            spriteData.spriteKey,
            initialFrame
        );
        initializeAnimations(this.sprite, spriteData.spriteKey, ...spriteKeys);
        this.sprite.setSize(spriteData.width, spriteData.height);
    }
    public setPosition(x: number, y: number): void {
        this.sprite.setX(x);
        this.sprite.setY(y);
    }
    public setAppearance(appearance: SpriteAppearance): void {
        this.spriteData = getSpriteMetaData(appearance.sprite);
        this.sprite.anims.play(appearance.anim, true);
        if (appearance.dir === "left") this.sprite.setFlipX(true);
        else this.sprite.setFlipX(false);
    }
    public getPosition(): { x: number; y: number } {
        return { x: this.sprite.x, y: this.sprite.y };
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
    /** Flashes the sprite white for 50ms. */
    public takeDamage(dmg: number): void {
        flashWhite(this.sprite);
    }
}

export class PlayerBody extends SpriteBody {
    /**
     * Adds a sprite representing a player character not controlled by *this* client
     * (instead by some other human, e.g. in multiplayer mode).
     * @inheritdoc
     *
     * @param name
     * @param scene
     * @param x
     * @param y
     * @param setHealthUI
     * @param setManaUI
     */
    public constructor(
        name: string,
        scene: Phaser.Scene,
        x: number,
        y: number,
        public readonly setHealthUI: (ratio: number) => void,
        public readonly setManaUI: (ratio: number) => void
    ) {
        super(
            name,
            scene,
            playerSpriteMetaData,
            [SpriteSheet.FOX, SpriteSheet.BEAR],
            x,
            y
        );
    }
}
