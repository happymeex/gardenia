import Phaser from "phaser";
import {
    loadSettingsIcon,
    configurePauseMenu,
    makeTransparentRectTexture,
    addPlayerStatusUI,
    createCanvasBoundaryWalls,
} from "../utils";
import { Player, HomingEnemy, getMotions } from "../Sprites";
import playerSpritesheet from "../static/gardenia_spritesheet.png";
import platform from "../static/platform.png";
import basicBotSpritesheet from "../static/basic_bot_spritesheet.png";
import waterfallBackground from "../static/waterfall-bg.jpg";
import {
    basicBotSpriteMetaData,
    CANVAS_CENTER,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    SpriteSheet,
} from "../constants";
import CombatManager from "../CombatManager";

class Survival extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Player;
    private isPaused: boolean;
    private combatManager: CombatManager;
    /** Maps names to enemy characters. */
    private readonly enemies: Map<string, HomingEnemy> = new Map();
    private readonly maxEnemies = 10;
    private numKilled = 0;

    public constructor() {
        super({ key: "survival" });
    }
    preload() {
        loadSettingsIcon(this);
        this.load.image(SpriteSheet.WATERFALL, waterfallBackground);
        this.load.image(SpriteSheet.PLATFORM, platform);
        this.load.spritesheet(SpriteSheet.PLAYER, playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.spritesheet(SpriteSheet.BASIC_BOT, basicBotSpritesheet, {
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
        this.add.image(...CANVAS_CENTER, SpriteSheet.WATERFALL);

        makeTransparentRectTexture(this, "ground", CANVAS_WIDTH, 20);
        createCanvasBoundaryWalls(platforms);
        platforms.create(CANVAS_WIDTH / 2, 609, "ground");

        this.combatManager = new CombatManager();
        const { setHealthUI, setManaUI } = addPlayerStatusUI(
            this,
            "Meex",
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 70
        );
        this.player = new Player(
            "Meex",
            this,
            platforms,
            300,
            300,
            this.makeDeathHandlers("player"),
            setHealthUI,
            setManaUI
        );
        this.player.registerAsCombatant(this.combatManager, "player");
        const createEnemy = () => {
            const numEnemies = this.enemies.size;
            if (numEnemies === this.maxEnemies) return;
            const name = `enemy-${this.numKilled}`;
            const enemy = new HomingEnemy(
                name,
                this,
                platforms,
                basicBotSpriteMetaData,
                CANVAS_WIDTH / 2,
                -500,
                this.makeDeathHandlers("enemy")
            );
            this.enemies.set(name, enemy);
            enemy.registerAsCombatant(this.combatManager, "enemy");
        };
        createEnemy();
        setInterval(createEnemy, 15 * 1000);
    }
    update() {
        const cursors = this.cursors; // holds keypress data
        if (cursors === undefined || this.isPaused) return;
        this.player.handleMotion(getMotions(cursors));
        for (const enemy of this.enemies.values()) {
            enemy.handleMotion(null);
        }
    }

    private makeDeathHandlers(
        type: "player" | "enemy"
    ): (name: string) => void {
        switch (type) {
            case "enemy":
                return (name) => {
                    this.enemies.delete(name);
                    this.combatManager.removeParticipant(name);
                    this.numKilled++;
                };
            case "player":
                return (name) => {
                    this.isPaused = true;
                    // TODO: play game over UI and show stats
                    this.scene.start("main-menu");
                };
        }
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
