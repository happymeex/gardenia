import Phaser from "phaser";
import { SpriteSheet } from "./constants";

const PLAYER_WALK_FPS = 10;
const BASIC_BOT_FPS = 10;

/**
 * Defines the appropriate animations on a given sprite.
 *
 * @param scene the scene containing the sprite
 * @param sprite the sprite to be animated
 * @param spriteKey the name of the spritesheet from which to take the anim frames
 */
export function initializeAnimations(
    sprite: Phaser.GameObjects.Sprite,
    spriteKey: string
) {
    const scene = sprite.scene;
    switch (spriteKey) {
        case SpriteSheet.PLAYER:
            sprite.anims.create({
                key: "walk",
                frames: scene.anims.generateFrameNumbers(spriteKey, {
                    start: 0,
                    end: 7,
                }),
                frameRate: PLAYER_WALK_FPS,
                repeat: -1,
            });
            sprite.anims.create({
                key: "attack",
                frames: scene.anims.generateFrameNumbers(spriteKey, {
                    frames: [
                        10, 11, 11, 11, 11, 11, 11, 12, 13, 14, 14, 14, 14, 14,
                        14, 15, 16, 16, 17, 18, 18, 18, 18, 18, 19, 20, 21, 22,
                        23, 23, 23, 24, 25, 26, 27,
                    ],
                }),
                frameRate: 24,
                repeat: 0,
            });
        case SpriteSheet.BASIC_BOT:
            sprite.anims.create({
                key: "walk",
                frames: scene.anims.generateFrameNumbers(spriteKey, {
                    start: 8,
                    end: 1,
                }),
                frameRate: BASIC_BOT_FPS,
                repeat: -1,
            });
            sprite.anims.create({
                key: "death",
                frames: scene.anims.generateFrameNames(spriteKey, {
                    frames: [11, 10, 26, 25, 24, 23, 22, 21, 20, 19, 19, 19],
                }),
                frameRate: 12,
                repeat: 0,
            });
            sprite.anims.create({
                key: "attack",
                frames: scene.anims.generateFrameNumbers(spriteKey, {
                    frames: [17, 16, 15, 14, 13, 12],
                }),
                frameRate: 10,
                repeat: 0,
            });
    }
}
