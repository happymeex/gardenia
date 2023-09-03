import Phaser from "phaser";
import { SpriteSheet } from "./constants";

/**
 * For each key in the provided list of sprite keys,
 * defines and adds the appropriate animations on a given sprite object.
 * Animation keys take the form `[spriteKey]-[action]`, where action is "walk", "attack",
 * "death", "jump", or "idle".
 *
 * @param sprite the sprite to be animated
 * @param spriteKeys array of spritesheet from which to take the anim frames
 */
export function initializeAnimations(
    sprite: Phaser.GameObjects.Sprite,
    ...spriteKeys: string[]
) {
    const scene = sprite.scene;
    if (spriteKeys.includes(SpriteSheet.PLAYER)) {
        const key = SpriteSheet.PLAYER;
        sprite.anims.create({
            key: `${key}-walk`,
            frames: scene.anims.generateFrameNumbers(key, {
                start: 0,
                end: 7,
            }),
            frameRate: 10,
            repeat: -1,
        });
        sprite.anims.create({
            key: `${key}-attack`,
            frames: scene.anims.generateFrameNumbers(key, {
                frames: [
                    10, 11, 11, 11, 11, 11, 11, 12, 13, 14, 14, 14, 14, 14, 14,
                    15, 16, 16, 17, 18, 18, 18, 18, 18, 19, 20, 21, 22, 23, 23,
                    23, 24, 25, 26, 27,
                ],
            }),
            frameRate: 24,
            repeat: 0,
        });
        sprite.anims.create({
            key: `${key}-death`,
            frames: scene.anims.generateFrameNumbers(key, {
                frames: [
                    32, 33, 34, 35, 36, 36, 36, 36, 36, 36, 36, 37, 38, 39, 31,
                    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
                ],
            }),
            frameRate: 15,
            repeat: 0,
        });
        sprite.anims.create({
            key: `${key}-idle`,
            frames: scene.anims.generateFrameNumbers(key, {
                frames: [27],
            }),
            frameRate: 1,
            repeat: -1,
        });
        sprite.anims.create({
            key: `${key}-jump`,
            frames: scene.anims.generateFrameNumbers(key, {
                frames: [29],
            }),
            frameRate: 1,
            repeat: -1,
        });
    }
    if (spriteKeys.includes(SpriteSheet.BASIC_BOT)) {
        const spriteKey = SpriteSheet.BASIC_BOT;
        sprite.anims.create({
            key: "walk",
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                start: 8,
                end: 1,
            }),
            frameRate: 10,
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
    if (spriteKeys.includes(SpriteSheet.FOX)) {
        const spriteKey = SpriteSheet.FOX;
        sprite.anims.create({
            key: `${spriteKey}-walk`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                start: 0,
                end: 7,
            }),
            frameRate: 18,
            repeat: -1,
        });
        sprite.anims.create({
            key: `${spriteKey}-attack`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                start: 8,
                end: 15,
            }),
        });
        sprite.anims.create({
            key: `${spriteKey}-idle`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                frames: [16, 17, 18, 19, 20],
            }),
            frameRate: 8,
            yoyo: true,
            repeat: -1,
        });
        sprite.anims.create({
            key: `${spriteKey}-jump`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                frames: [15],
            }),
            frameRate: 1,
            repeat: -1,
        });
    }
    if (spriteKeys.includes(SpriteSheet.BEAR)) {
        const spriteKey = SpriteSheet.BEAR;
        sprite.anims.create({
            key: `${spriteKey}-walk`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                start: 0,
                end: 7,
            }),
            frameRate: 8,
            repeat: -1,
        });
        sprite.anims.create({
            key: `${spriteKey}-attack`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                frames: [8, 9, 10, 11, 11, 11, 11, 12, 13, 14],
            }),
            frameRate: 10,
        });
        sprite.anims.create({
            key: `${spriteKey}-idle`,
            frames: scene.anims.generateFrameNumbers(spriteKey, {
                frames: [14],
            }),
            frameRate: 1,
            repeat: -1,
        });
    }
}
