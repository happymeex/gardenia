import Phaser from "phaser";

const PLAYER_WALK_FPS = 12;
export const PLAYER_HITBOX_WIDTH = 64;
export const PLAYER_HITBOX_HEIGHT = 105;

export function initializeAnimations(
    scene: Phaser.Scene,
    object: Phaser.GameObjects.Sprite,
    textureKey: string
) {
    switch (textureKey) {
        case "player":
            object.anims.create({
                key: "right",
                frames: scene.anims.generateFrameNumbers("player", {
                    start: 0,
                    end: 7,
                }),
                frameRate: PLAYER_WALK_FPS,
                repeat: -1,
            });
            object.anims.create({
                key: "left",
                frames: scene.anims.generateFrameNumbers("player", {
                    start: 15,
                    end: 8,
                }),
                frameRate: PLAYER_WALK_FPS,
                repeat: -1,
            });
    }
}
