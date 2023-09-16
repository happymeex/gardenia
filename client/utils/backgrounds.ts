import { makeTransparentRectTexture, createCanvasBoundaryWalls } from "./utils";
import {
    CANVAS_WIDTH,
    CANVAS_CENTER,
    SpriteSheet,
    ImageAsset,
} from "./constants";

// This file contains templates for gameplay scene layouts (backgrounds and platforms).

/**
 * Adds waterfall bg with flat ground and three platforms, like final destination from Smash.
 * Impassable walls on both ends of the canvas.
 * Assumes the scene has already preloaded the waterfall background image.
 *
 * @param scene
 * @returns StaticGroup object representing the platforms
 */
export function addWaterfallBackground(
    scene: Phaser.Scene
): Phaser.Physics.Arcade.StaticGroup {
    const platforms = scene.physics.add.staticGroup();
    scene.add.image(...CANVAS_CENTER, ImageAsset.WATERFALL);
    makeTransparentRectTexture(scene, "ground", CANVAS_WIDTH, 20);
    createCanvasBoundaryWalls(platforms);
    platforms.create(CANVAS_WIDTH / 2, 609, "ground");
    return platforms;
}
