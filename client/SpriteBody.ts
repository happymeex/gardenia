import Phaser from "phaser";
import { initializeAnimations } from "./animations";
import {
    PlayerFrames,
    SpriteSheet,
    playerSpriteMetaData,
    CanBeHit,
} from "./constants";
import { flashWhite } from "./utils";

export type SpriteAppearance = {
    type: "anim" | "frame";
    value: string;
    direction: "left" | "right";
};

class SpriteBody implements CanBeHit {
    private readonly sprite: Phaser.GameObjects.Sprite;
    public constructor(
        public readonly name: string,
        private readonly scene: Phaser.Scene,
        private readonly spritesheetName: string,
        private readonly width: number,
        private readonly height: number,
        x: number,
        y: number,
        initialFrame = 0
    ) {
        this.sprite = scene.add.sprite(x, y, spritesheetName, initialFrame);
        initializeAnimations(this.sprite, spritesheetName);
        this.sprite.setSize(width, height);
    }
    public setPosition(x: number, y: number): void {
        this.sprite.setX(x);
        this.sprite.setY(y);
    }
    public setAppearance(appearance: SpriteAppearance | "same"): void {
        if (appearance === "same") return;
        switch (appearance.type) {
            case "anim":
                this.sprite.anims.play(appearance.value, true);
                break;
            case "frame":
                this.sprite.anims.stop();
                this.sprite.setFrame(Number(appearance.value));
        }
        if (appearance.direction === "left") this.sprite.setFlipX(true);
        else this.sprite.setFlipX(false);
    }
    public getPosition(): { x: number; y: number } {
        return { x: this.sprite.x, y: this.sprite.y };
    }
    public getBounds(): Phaser.Geom.Rectangle {
        const { x, y } = this.getPosition();
        return new Phaser.Geom.Rectangle(x, y, this.width, this.height);
    }
    public takeDamage(dmg: number): void {
        flashWhite(this.sprite);
    }
}

export class PlayerBody extends SpriteBody {
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
            SpriteSheet.PLAYER,
            playerSpriteMetaData.width,
            playerSpriteMetaData.height,
            x,
            y,
            PlayerFrames.IDLE
        );
    }
}
