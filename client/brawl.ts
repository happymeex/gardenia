import Phaser from "phaser";
import background from "./static/forest_bg.png";
import playerSpritesheet from "./static/gardenia_spritesheet.png";

const WALK_FRAME_RATE = 12;
const WALK_VELOCITY = 450;

class BrawlScene extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private playerDirection: "left" | "right" = "right";
    public constructor() {
        super({ key: "brawl" });
    }
    preload() {
        console.log(background);
        this.load.image("background", background);
        this.load.spritesheet("player", playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        this.add.image(1920, 0, "background");
        const platforms = this.physics.add.staticGroup();
        this.player = this.physics.add.sprite(100, 800, "player", 16);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, platforms);

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 7,
            }),
            frameRate: WALK_FRAME_RATE,
            repeat: -1,
        });
        this.anims.create({
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
        if (this.cursors?.right.isDown) {
            this.playerDirection = "right";
            this.player.setVelocityX(WALK_VELOCITY);
            this.player.anims.play("right", true);
        } else if (this.cursors?.left.isDown) {
            this.playerDirection = "left";
            this.player.setVelocityX(-WALK_VELOCITY);
            this.player.anims.play("left", true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.stop(); // temporary; will replace with idle animation later
            this.player.setFrame(this.playerDirection === "right" ? 16 : 18);
        }
    }
}

export default BrawlScene;
