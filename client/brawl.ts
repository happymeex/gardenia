import Phaser from "phaser";
import background from "./static/forest_bg.png";
import playerSpritesheet from "./static/gardenia_spritesheet.png";
import forestPlatform from "./static/forest_platform.png";

const WALK_FRAME_RATE = 12;
const WALK_VELOCITY = 450;
const JUMP_VELOCITY = 800;
type CollisionObject =
    | Phaser.Types.Physics.Arcade.GameObjectWithBody
    | Phaser.Tilemaps.Tile;

interface PlayerData {
    direction: "left" | "right";
    inAir: boolean;
}
class BrawlScene extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private playerData: PlayerData = {
        direction: "right",
        inAir: true,
    };
    public constructor() {
        super({ key: "brawl" });
        this.playerData = {
            direction: "right",
            inAir: true,
        };
    }
    private makeCollider() {
        return (player: CollisionObject, platforms: CollisionObject) => {
            // silly typechecking to rule out player being tile type
            if ("body" in player && player.body.touching.down) {
                this.playerData.inAir = false;
            }
        };
    }
    preload() {
        console.log(background);
        this.load.image("platform", forestPlatform);
        this.load.spritesheet("player", playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        const platforms = this.physics.add.staticGroup();
        platforms.create(100, 800, "platform");
        platforms.create(250, 800, "platform");
        platforms.create(400, 800, "platform");
        platforms.create(550, 800, "platform");
        platforms.create(700, 800, "platform");
        this.player = this.physics.add.sprite(100, 300, "player", 16);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, platforms, this.makeCollider());

        this.player.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 7,
            }),
            frameRate: WALK_FRAME_RATE,
            repeat: -1,
        });
        this.player.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("player", {
                start: 15,
                end: 8,
            }),
            frameRate: WALK_FRAME_RATE,
            repeat: -1,
        });
    }
    update() {
        if (this.cursors?.up.isDown) {
            if (!this.playerData.inAir) {
                this.player.setVelocityY(-JUMP_VELOCITY);
                this.playerData.inAir = true;
            }
        }
        if (this.cursors?.right.isDown) {
            this.playerData.direction = "right";
            this.player.setVelocityX(WALK_VELOCITY);
            this.player.anims.play("right", true);
        } else if (this.cursors?.left.isDown) {
            this.playerData.direction = "left";
            this.player.setVelocityX(-WALK_VELOCITY);
            this.player.anims.play("left", true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.stop(); // temporary; will replace with idle animation later
            this.player.setFrame(
                this.playerData.direction === "right" ? 16 : 18
            );
        }
    }
}

export default BrawlScene;
