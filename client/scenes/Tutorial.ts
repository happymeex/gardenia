import Phaser from "phaser";
import { configurePauseMenu } from "../ui";
import {
    BattleScene,
    loadSettingsIcon,
    loadSprites,
    addPlayerStatusUI,
    SpecialKeys,
    createSpecialKeys,
} from "../utils";
import { addWaterfallBackground } from "../backgrounds";
import { SpriteSheet, CANVAS_HEIGHT, CANVAS_WIDTH, USER } from "../constants";
import platform from "../static/platform.png";
import waterfallBackground from "../static/waterfall-bg.jpg";
import { CombatManager } from "../CombatManager";
import { Player, getMotions } from "../Player";
import { HomingEnemy } from "../Enemies";
import { handleTransformation, intersect, inRange } from "../utils";

class Tutorial extends Phaser.Scene implements BattleScene {
    private isPaused = false;
    private processes: Map<string, number> = new Map();
    private combatManager: CombatManager;
    private player: Player;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private readonly enemies: Map<string, HomingEnemy> = new Map();
    private specialKeys: SpecialKeys;
    public constructor() {
        super({ key: "tutorial" });
    }
    preload() {
        this.load.image(SpriteSheet.WATERFALL, waterfallBackground);
        this.load.image(SpriteSheet.PLATFORM, platform);
        loadSettingsIcon(this);
        loadSprites(this);
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        this.isPaused = false;
        this.processes.clear();
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configurePauseMenu(this, pause, resume, leave);
        const platforms = addWaterfallBackground(this);
        this.specialKeys = createSpecialKeys(this);
        this.combatManager = new CombatManager();
        const { setHealthUI, setManaUI, changeIcon } = addPlayerStatusUI(
            this,
            USER.name,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 70
        );
        this.player = new Player(
            USER.name,
            this,
            platforms,
            300,
            300,
            this.makeDeathHandlers("player"),
            setHealthUI,
            setManaUI,
            changeIcon
        );
        this.player.registerAsCombatant(this.combatManager, "player");
    }
    update() {
        const cursors = this.cursors; // holds keypress data
        if (cursors === undefined || this.isPaused) return;
        handleTransformation(this.player, this.specialKeys);
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
    public getIsPaused(): boolean {
        return this.isPaused;
    }
    public addProcess(processName: string, process: number): void {
        this.processes.set(processName, process);
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
                };
            case "player":
                return (name) => {
                    //this.isPaused = true;
                };
        }
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

    private addTutorialText() {}
}

export default Tutorial;
