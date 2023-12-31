import Phaser from "phaser";
import {
    addPlayerStatusUI,
    createTimer,
    intersect,
    inRange,
    handleTransformation,
    SpecialKeys,
    createSpecialKeys,
    fadeToNextScene,
    composeBuffs,
} from "../utils/utils";
import {
    configurePauseMenu,
    createDarkenedOverlay,
    makeClickable,
} from "../utils/ui";
import { Player, getMotions } from "../Player";
import { BombBot, Enemy, BasicBot } from "../Enemies";
import {
    CANVAS_CENTER,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    Sound,
    SurvivalDifficultyParams,
    NoBuff,
    Buff,
    ImageAsset,
} from "../utils/constants";
import { CombatManager } from "../CombatManager";
import { menuTextStyleBase, paragraphTextStyleBase } from "../utils/ui";
import { addWaterfallBackground } from "../utils/backgrounds";
import { BGM } from "../BGM";
import { USER } from "../User";

class Survival extends Phaser.Scene {
    /** Manages arrow key and space bar presses. */
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    /** The player character, controlled by keyboard input. */
    private player: Player;
    /** Indicates whether or not the scene is paused. */
    private isPaused: boolean;
    private combatManager: CombatManager;
    /** Maps names to enemy characters. Remember to clear this for each new game. */
    private readonly enemies: Map<string, Enemy> = new Map();
    /** Number of enemies spawned in this survival game. Reset for each new game. */
    private numSpawned = 0;
    /** Number of enemies killed in this survival game. Reset for each new game. */
    private numKilled = 0;
    private timer: Phaser.GameObjects.Text;
    /**
     * Tracks process numbers created by calls to `setInterval`. Remember to clear them
     * before leaving the scene.
     */
    private processes: Map<string, number> = new Map();
    /** Button at the top right corner. */
    private settingsButton: Phaser.GameObjects.Image;
    /** Manages F, B, G keypresses. */
    private specialKeys: SpecialKeys;
    /**
     * Buff applied to newly spawned enemies. Increases over time at a frequency
     * depending on the selected survival mode difficulty.
     */
    private enemyBuff: Buff = NoBuff;

    public constructor() {
        super({ key: "survival" });
    }
    preload() {
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create(params: SurvivalDifficultyParams) {
        this.enemyBuff = NoBuff;
        this.isPaused = false;
        this.enemies.clear();
        this.numKilled = 0;
        this.numSpawned = 0;
        this.processes.clear();
        BGM.play(this, Sound.BATTLE_THEME);

        this.specialKeys = createSpecialKeys(this);
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        this.settingsButton = configurePauseMenu(this, pause, resume, leave);
        const platforms = addWaterfallBackground(this);
        platforms.create(CANVAS_WIDTH / 2, 230, ImageAsset.PLATFORM);
        platforms.create(CANVAS_WIDTH / 2 - 300, 420, ImageAsset.PLATFORM);
        platforms.create(CANVAS_WIDTH / 2 + 300, 420, ImageAsset.PLATFORM);

        this.combatManager = new CombatManager();
        const { setHealthUI, setManaUI, changeIcon } = addPlayerStatusUI(
            this,
            USER.getName(),
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 70
        );
        this.player = new Player(
            USER.getName(),
            this,
            platforms,
            CANVAS_WIDTH / 2,
            350,
            this.makeDeathHandlers("player"),
            setHealthUI,
            setManaUI,
            changeIcon,
            () => {},
            "right"
        );
        this.player.registerAsCombatant(this.combatManager, "player");
        const createEnemy = () => {
            if (this.isPaused) return;
            const numEnemies = this.enemies.size;
            if (numEnemies === params.maxEnemies) return;
            const name = `enemy-${this.numSpawned}`;
            let enemy: BasicBot | BombBot;
            const direction = Math.random() < 0.5 ? "left" : "right";
            if (Math.random() < 0.5) {
                enemy = new BasicBot(
                    name,
                    this,
                    platforms,
                    CANVAS_WIDTH / 2,
                    -500,
                    this.makeDeathHandlers("enemy"),
                    direction,
                    this.enemyBuff
                );
            } else {
                enemy = new BombBot(
                    name,
                    this,
                    platforms,
                    CANVAS_WIDTH / 2,
                    -500,
                    this.makeDeathHandlers("enemy"),
                    direction,
                    this.enemyBuff
                );
            }
            this.enemies.set(name, enemy);
            enemy.registerAsCombatant(this.combatManager, "enemy");
            this.numSpawned++;
        };
        createEnemy();
        const spawner = setInterval(createEnemy, params.spawnPeriod * 1000);
        const difficultyIncrease = setInterval(() => {
            this.enemyBuff = composeBuffs(this.enemyBuff, params.enemyBuff);
        }, params.difficultyIncreasePeriod * 1000);

        const { timeText, processNumber } = createTimer(
            this,
            CANVAS_WIDTH - 100,
            45
        );
        this.timer = timeText.setOrigin(1, 0.5);

        this.processes.set("difficulty-increase", difficultyIncrease);
        this.processes.set("enemy-spawner", spawner);
        this.processes.set("timer", processNumber);
    }
    update() {
        const cursors = this.cursors; // holds keypress data
        if (cursors === undefined || this.isPaused) return;
        handleTransformation(this.player, this.specialKeys);
        this.player.handleMotion(getMotions(cursors));
        const { x: px, y: py } = this.player.getPosition();
        for (const enemy of this.enemies.values()) {
            const { x: ex, y: ey } = enemy.getPosition();
            if (intersect(this.player, enemy)) {
                enemy.attack();
            } else if (
                Math.abs(py - ey) < 80 && // homing iff enemy and player are roughly eye level, and...
                inRange(this.player, enemy, 300) // are within reasonable distance
            ) {
                enemy.handleMotion(px < ex ? "left" : "right");
            } else enemy.handleMotion(null);
        }
    }

    public addProcess(processName: string, process: number) {
        this.processes.set(processName, process);
    }

    /** @returns pause status of the survival scene. */
    public getIsPaused() {
        return this.isPaused;
    }

    /**
     * Returns a handler function to be run when either a player or enemy character dies.
     *
     * @param type indicator of which type of sprite character to make the handler for
     * @returns a function taking in a string name identifying the character
     */
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
            BGM.fadeOut(this);
            fadeToNextScene(this, "main-menu");
        });
        container.add(
            [header, LHS, RHS, returnToMenu].map((item) => item.setOrigin(0.5))
        );
        container.setDepth(100);
    }

    /**
     * Creates handler functions that should be called when the scene is paused, resumed,
     * or left.
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
                this.game.input.keyboard?.clearCaptures();
            },
        };
    }
}

export default Survival;
