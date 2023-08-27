import Phaser from "phaser";

const PLAYER_WALK_FPS = 10;
export const PLAYER_HITBOX_WIDTH = 64;
export const PLAYER_HITBOX_HEIGHT = 105;

/**
 * Defines the appropriate animations on a given sprite.
 *
 * @param scene the scene containing the sprite
 * @param sprite the sprite to be animated
 * @param textureKey the key of the spritesheet from which to take the anim frames
 */
export function initializeAnimations(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite,
    textureKey: string
) {
    switch (textureKey) {
        case "player":
            sprite.anims.create({
                key: "walk",
                frames: scene.anims.generateFrameNumbers("player", {
                    start: 0,
                    end: 7,
                }),
                frameRate: PLAYER_WALK_FPS,
                repeat: -1,
            });
            sprite.anims.create({
                key: "attack",
                frames: scene.anims.generateFrameNumbers("player", {
                    frames: [
                        10, 11, 11, 11, 11, 11, 11, 12, 13, 14, 14, 14, 14, 14,
                        14, 15, 16, 16, 17, 18, 18, 18, 18, 18, 19, 20, 21, 22,
                        23, 23, 23, 24, 25, 26, 27,
                    ],
                }),
                frameRate: 24,
                repeat: 0,
            });
    }
}
