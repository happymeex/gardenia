import Phaser from "phaser";
import { initializeAnimations } from "./animations";
import { PLAYER_HITBOX_WIDTH, PLAYER_HITBOX_HEIGHT } from "./animations";
import { SpriteSheet } from "./constants";

export type SpriteAppearance = {
    type: "anim" | "frame";
    value: string;
};

class SpriteBody {
    private readonly sprite: Phaser.GameObjects.Sprite;
    public constructor(
        private readonly scene: Phaser.Scene,
        private readonly spritesheetName: string,
        width: number,
        height: number,
        x: number,
        y: number,
        initialFrame = 0
    ) {
        this.sprite = scene.add.sprite(x, y, spritesheetName, initialFrame);
        initializeAnimations(scene, this.sprite, spritesheetName);
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
    }
}

const playerFrames = {
    right: 16, // idle
    left: 18, //idle
} as const;

export class PlayerBody extends SpriteBody {
    public constructor(
        scene: Phaser.Scene,
        locationX: number,
        locationY: number,
        direction: "left" | "right"
    ) {
        super(
            scene,
            SpriteSheet.PLAYER,
            PLAYER_HITBOX_WIDTH,
            PLAYER_HITBOX_HEIGHT,
            locationX,
            locationY,
            playerFrames[direction]
        );
    }
}
