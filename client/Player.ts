import Phaser from "phaser";
import playerSpritesheet from "./static/gardenia_spritesheet.png";

const SPRITE_SIZE = 128; // square sprites
const DIRECTIONS = ["left", "right", "up", "down"] as const;
const WALK_FRAME_RATE = 12;
const WALK_VELOCITY = 450;
const JUMP_VELOCITY = 800;
const HITBOX_WIDTH = 64;
const HITBOX_HEIGHT = 105;
type CollisionObject =
    | Phaser.Types.Physics.Arcade.GameObjectWithBody
    | Phaser.Tilemaps.Tile;

const playerFrames = {
    right: 16, // idle
    left: 18, //idle
} as const;

class Player {
    private readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    public constructor(
        public readonly key: string,
        readonly scene: Phaser.Scene,
        readonly platforms: Phaser.Physics.Arcade.StaticGroup,
        locationX: number,
        locationY: number,
        private direction: "left" | "right" = "right",
        private inAir: boolean = false
    ) {
        if (!scene.textures.exists("player")) {
            scene.load.spritesheet("player", playerSpritesheet, {
                frameWidth: SPRITE_SIZE,
                frameHeight: SPRITE_SIZE,
            });
        }
        this.player = scene.physics.add.sprite(
            locationX,
            locationY,
            "player",
            playerFrames[direction]
        );
        this.player.setCollideWorldBounds(true);
        this.player.anims.create({
            key: "right",
            frames: scene.anims.generateFrameNumbers("player", {
                start: 0,
                end: 7,
            }),
            frameRate: WALK_FRAME_RATE,
            repeat: -1,
        });
        this.player.anims.create({
            key: "left",
            frames: scene.anims.generateFrameNumbers("player", {
                start: 15,
                end: 8,
            }),
            frameRate: WALK_FRAME_RATE,
            repeat: -1,
        });
        scene.physics.add.collider(this.player, platforms, this.makeCollider());
        this.player.setSize(HITBOX_WIDTH, HITBOX_HEIGHT);
    }
    private makeCollider() {
        return (player: CollisionObject, platforms: CollisionObject) => {
            // silly typechecking to rule out player being tile type
            if ("body" in player && player.body.touching.down) {
                this.inAir = false;
            }
        };
    }

    /**
     * Moves and animates the player character appropriately given keypress data.
     *
     * @param dirs indicates which keys are currently pressed
     */
    public handleMotion(dirs: { [K in (typeof DIRECTIONS)[number]]: boolean }) {
        let noAnim = false;
        if (dirs.up) {
            if (!this.inAir) {
                this.player.anims.stop();
                noAnim = true;
                this.player.setVelocityY(-JUMP_VELOCITY);
                this.inAir = true;
            }
        }
        if (dirs.left) {
            this.direction = "left";
            this.player.setVelocityX(-WALK_VELOCITY);
            if (!this.inAir) this.player.anims.play("left", true);
            else noAnim = true;
        } else if (dirs.right) {
            this.direction = "right";
            this.player.setVelocityX(WALK_VELOCITY);
            if (!this.inAir) this.player.anims.play("right", true);
            else noAnim = true;
        } else {
            this.player.setVelocityX(0);
            this.player.anims.stop(); // temporary; will replace with idle animation later
            noAnim = true;
        }
        if (noAnim) this.player.setFrame(playerFrames[this.direction]);
    }
}

/**
 * Utility function for extracting directional keypress information.
 *
 * @param cursors
 * @returns object with fields corresponding to the four directions, whose values
 *      are booleans indicating whether or not that key is currently pressed
 */
export function getMotions(cursors: Phaser.Types.Input.Keyboard.CursorKeys): {
    [K in (typeof DIRECTIONS)[number]]: boolean;
} {
    const ret = { up: false, down: false, left: false, right: false };
    DIRECTIONS.forEach((dir) => {
        ret[dir] = cursors[dir].isDown;
    });
    return ret;
}

export default Player;
