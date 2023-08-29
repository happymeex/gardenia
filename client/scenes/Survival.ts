import Phaser from "phaser";
import {
    loadSettingsIcon,
    configurePauseMenu,
    makeTransparentRectTexture,
    addPlayerStatusUI,
    createCanvasBoundaryWalls,
    createTimer,
    createDarkenedOverlay,
    makeClickable,
    intersect,
    inRange,
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
import { menuTextStyleBase, paragraphTextStyleBase } from "../ui";
import { addWaterfallBackground } from "../backgrounds";

class Survival extends Phaser.Scene {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private player: Player;
    private isPaused: boolean;
    private combatManager: CombatManager;
    /** Maps names to enemy characters. */
    private readonly enemies: Map<string, HomingEnemy> = new Map();
    private readonly maxEnemies = 8;
    private numSpawned = 0;
    private numKilled = 0;
    private timer: Phaser.GameObjects.Text;
    private processes: Map<string, number> = new Map();
    private settingsButton: Phaser.GameObjects.Image;

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
        this.enemies.clear();
        this.numKilled = 0;
        this.numSpawned = 0;
        this.processes.clear();
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        this.settingsButton = configurePauseMenu(this, pause, resume, leave);
        const platforms = addWaterfallBackground(this);

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
            if (this.isPaused) return;
            const numEnemies = this.enemies.size;
            if (numEnemies === this.maxEnemies) return;
            const name = `enemy-${this.numSpawned}`;
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
            this.numSpawned++;
        };
        createEnemy();
        const spawner = setInterval(createEnemy, 15 * 1000);

        const { timeText, processNumber } = createTimer(
            this,
            CANVAS_WIDTH - 100,
            45
        );
        this.timer = timeText.setOrigin(1, 0.5);

        this.processes.set("enemy-spawner", spawner);
        this.processes.set("timer", processNumber);
    }
    update() {
        const cursors = this.cursors; // holds keypress data
        if (cursors === undefined || this.isPaused) return;
        this.player.handleMotion(getMotions(cursors));
        for (const enemy of this.enemies.values()) {
            if (intersect(this.player, enemy)) {
                enemy.attack();
            } else if (inRange(this.player, enemy, 300)) {
                enemy.handleMotion(
                    this.player.getPosition().x < enemy.getPosition().x
                        ? "left"
                        : "right"
                );
            } else enemy.handleMotion(null);
        }
    }

    /** @returns pause status of the survival scene. */
    public getIsPaused() {
        return this.isPaused;
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
                    this.gameOver();
                };
        }
    }

    private gameOver() {
        createDarkenedOverlay(this);
        this.settingsButton.disableInteractive();
        const container = this.add.container(...CANVAS_CENTER);
        const header = this.add.text(0, -100, "You Died", {
            ...menuTextStyleBase,
            fontSize: "96px",
        });
        const LHS = this.add.text(
            -60,
            10,
            "Enemies destroyed:\nTime survived:",
            {
                ...paragraphTextStyleBase,
                fontSize: "32px",
                lineSpacing: 6,
                align: "right",
            }
        );
        const RHS = this.add.text(
            130,
            10,
            `${this.numKilled}\n${this.timer.text}`,
            {
                ...paragraphTextStyleBase,
                fontSize: "32px",
                lineSpacing: 6,
                align: "center",
            }
        );
        const returnToMenu = this.add.text(0, 190, "Return to Main Menu", {
            ...menuTextStyleBase,
            fontSize: "40px",
        });
        makeClickable(returnToMenu, this, () => {
            this.makeFlowControlFunctions().leave();
            this.scene.start("main-menu");
        });
        container.add(
            [header, LHS, RHS, returnToMenu].map((item) => item.setOrigin(0.5))
        );
        container.setDepth(100);
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
            leave: () => {
                for (const processNumber of this.processes.values())
                    clearInterval(processNumber);
            },
        };
    }
}

export default Survival;
