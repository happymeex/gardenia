import { CollisionObject } from "../BaseSprite";

/**
 * Handles collisions between a sprite and platforms, causing the sprite to turn around when it hits a wall.
 * @param sprite The sprite that is colliding with the platforms.
 * @param platforms The platforms in the scene.
 * @param setFlipX A function to set the flipX property of the sprite.
 * @param setVelocityX A function to set the velocityX property of the sprite.
 * @param direction A function to get the current direction of the sprite.
 * @param walkSpeed The walk speed of the sprite.
 */
export function handleWallCollision(
    sprite: CollisionObject,
    platforms: CollisionObject,
    setFlipX: (flipX: boolean) => void,
    setVelocityX: (velocityX: number) => void,
    direction: () => "left" | "right",
    walkSpeed: number
) {
    if (!("body" in sprite)) return;
    if (sprite.body.touching.down) {
        //this.inAir = false; // Assuming inAir is handled elsewhere
    }
    // turn around when hitting walls
    if (sprite.body.touching.left) {
        setFlipX(false);
        if (direction() === "right") {
            setVelocityX(walkSpeed);
        }
    } else if (sprite.body.touching.right) {
        setFlipX(true);
        if (direction() === "left") {
            setVelocityX(-walkSpeed);
        }
    }
}
