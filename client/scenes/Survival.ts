import Phaser from "phaser";
import { loadSettingsIcon, configureSettingsPanel } from "../utils";
import Player, { getMotions } from "../Player";
import playerSpritesheet from "../static/gardenia_spritesheet.png";
import forestPlatform from "../static/forest_platform.png";
class Survival extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Player;
    private isPaused = false;
    public constructor() {
        super({ key: "survival" });
    }
    preload() {
        loadSettingsIcon(this);
        this.load.image("platform", forestPlatform);
        this.load.spritesheet("player", playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        const { pause, resume } = this.makeFlowControlFunctions();
        configureSettingsPanel(this, pause, resume);
        const platforms = this.physics.add.staticGroup();

        platforms.create(100, 800, "platform");
        platforms.create(300, 800, "platform");
        platforms.create(400, 800, "platform");
        platforms.create(520, 800, "platform");
        platforms.create(730, 800, "platform");
        this.player = new Player("meex", this, platforms, 300, 300);
    }
    update() {
        const cursors = this.cursors; // holds keypress data
        if (cursors === undefined || this.isPaused) return;
        this.player.handleMotion(getMotions(cursors));
    }

    /**
     * Creates two handler functions that pause and resume the scene.
     * Specifically: pausing/resuming the physics engine, and toggling
     * `this.isPause`.
     *
     * @returns Object whose values are the appropriate pause and resume functions
     */
    private makeFlowControlFunctions() {
        return {
            pause: () => {
                this.physics.pause();
                this.isPaused = true;
            },
            resume: () => {
                this.physics.resume();
                this.isPaused = false;
            },
        };
    }
}

export default Survival;
