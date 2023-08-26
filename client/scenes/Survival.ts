import Phaser from "phaser";
import {
    loadSettingsIcon,
    configurePauseMenu,
    createTransparentGroundTexture,
} from "../utils";
import Player, { getMotions } from "../Player";
import playerSpritesheet from "../static/gardenia_spritesheet.png";
import platform from "../static/platform.png";
import basicBotSpritesheet from "../static/basic_bot_spritesheet.png";
import waterfallBackground from "../static/waterfall-bg.jpg";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";

class Survival extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Player;
    private isPaused: boolean;
    public constructor() {
        super({ key: "survival" });
    }
    preload() {
        loadSettingsIcon(this);
        this.load.image("waterfall-bg", waterfallBackground);
        this.load.image("platform", platform);
        this.load.spritesheet("player", playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.spritesheet("basic-bot", basicBotSpritesheet, {
            frameWidth: 96,
            frameHeight: 128,
        });
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        this.isPaused = false;
        const { pause, resume } = this.makeFlowControlFunctions();
        configurePauseMenu(this, pause, resume);
        const platforms = this.physics.add.staticGroup();
        this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "waterfall-bg");

        createTransparentGroundTexture(this, "ground", CANVAS_WIDTH, 20);
        platforms.create(CANVAS_WIDTH / 2, 609, "ground");

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
