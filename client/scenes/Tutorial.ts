import Phaser from "phaser";
import { configurePauseMenu, paragraphTextStyleBase } from "../ui";
import {
    BattleScene,
    loadSettingsIcon,
    loadSprites,
    addPlayerStatusUI,
    SpecialKeys,
    createSpecialKeys,
} from "../utils";
import { addWaterfallBackground } from "../backgrounds";
import {
    SpriteSheet,
    Sound,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    USER,
} from "../constants";
import platform from "../static/platform.png";
import waterfallBackground from "../static/waterfall-bg.jpg";
import { CombatManager } from "../CombatManager";
import { Player, getMotions } from "../Player";
import { BasicBot } from "../Enemies";
import { handleTransformation, intersect, inRange } from "../utils";
import whoosh from "../static/whoosh.mp3";

const SECONDS_BETWEEN_ENEMY_SPAWN = 10;

/** Sequence of text to display. Pressing enter should move to the next one. */
const TUTORIAL_TEXT = [
    "Use the arrow keys to walk and jump.",
    "Press SPACE to attack.",
    "Your health and mana bars are shown in green and blue, respectively.\nThey automatically regenerate over time.",
    "Press F, B, and G to switch between Fox, Bear, and Human modes.\nNote that each transformation costs mana!",
    "Click the icon in the top right to pause the game.",
];

class Tutorial extends Phaser.Scene implements BattleScene {
    private isPaused = false;
    private processes: Map<string, number> = new Map();
    private combatManager: CombatManager;
    private player: Player;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private readonly enemies: Map<string, BasicBot> = new Map();
    private specialKeys: SpecialKeys;
    private currTextIndex = 0;
    /** The tutorial text currently on screen. */
    private currText: Phaser.GameObjects.Container | null = null;
    private enterKey: Phaser.Input.Keyboard.Key | undefined = undefined;
    private platforms: Phaser.Physics.Arcade.StaticGroup;
    private UIContainer: Phaser.GameObjects.Container;
    private readonly maxEnemies = 3;
    private numSpawned = 0;

    public constructor() {
        super({ key: "tutorial" });
    }
    preload() {
        this.load.image(SpriteSheet.WATERFALL, waterfallBackground);
        this.load.image(SpriteSheet.PLATFORM, platform);
        loadSettingsIcon(this);
        loadSprites(this);
        this.load.audio(Sound.WHOOSH, whoosh);
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create() {
        this.numSpawned = 0;
        this.isPaused = false;
        this.enemies.clear();
        this.processes.clear();
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configurePauseMenu(this, pause, resume, leave);
        const platforms = addWaterfallBackground(this);
        this.platforms = platforms;
        this.specialKeys = createSpecialKeys(this);
        this.combatManager = new CombatManager();
        const { setHealthUI, setManaUI, changeIcon, container } =
            addPlayerStatusUI(this, USER.getName(), 110, 50);
        this.UIContainer = container;
        this.player = new Player(
            USER.getName(),
            this,
            platforms,
            300,
            300,
            this.makeDeathHandlers("player"),
            setHealthUI,
            setManaUI,
            changeIcon,
            () => {}
        );
        this.player.registerAsCombatant(this.combatManager, "player");
        this.currTextIndex = 0;
        this.addTutorialText(TUTORIAL_TEXT[0]);
        this.enterKey = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.ENTER
        );
        if (this.enterKey) {
            this.enterKey.on("down", () => {
                if (this.isPaused) return;
                this.addTutorialText(
                    TUTORIAL_TEXT[this.currTextIndex + 1] ?? ""
                );
                this.currTextIndex++;
            });
        }
        const createEnemy = () => {
            if (this.isPaused) return;
            const numEnemies = this.enemies.size;
            if (numEnemies === this.maxEnemies) return;
            const name = `enemy-${this.numSpawned}`;
            const enemy = new BasicBot(
                name,
                this,
                platforms,
                CANVAS_WIDTH / 2,
                -500,
                this.makeDeathHandlers("enemy")
            );
            this.enemies.set(name, enemy);
            enemy.registerAsCombatant(this.combatManager, "enemy");
            this.numSpawned++;
        };
        const spawner = setInterval(
            createEnemy,
            SECONDS_BETWEEN_ENEMY_SPAWN * 1000
        );
        this.processes.set("enemy-spawner", spawner);
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
                    this.combatManager.removeParticipant(name);
                    // respawn player after slight delay
                    setTimeout(() => {
                        this.UIContainer.destroy();
                        const {
                            setHealthUI,
                            setManaUI,
                            changeIcon,
                            container,
                        } = addPlayerStatusUI(this, USER.getName(), 110, 50);
                        this.UIContainer = container;
                        this.player = new Player(
                            USER.getName(),
                            this,
                            this.platforms,
                            300,
                            -100,
                            this.makeDeathHandlers("player"),
                            setHealthUI,
                            setManaUI,
                            changeIcon,
                            () => {}
                        );
                        this.player.registerAsCombatant(
                            this.combatManager,
                            "player"
                        );
                    }, 1000);
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

    /**
     * Displays `text` at the bottom center of the game screen, along with
     * "(Press ENTER to continue)" underneath. Also removes the text that was there previously.
     *
     * @param text Text to be displayed. If empty string, then no new text is added.
     */
    private addTutorialText(text: string): void {
        if (this.currText) this.currText.destroy();
        if (text === "") return;
        this.currText = this.add.container(
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 80
        );
        const content = this.add
            .text(0, 0, text, paragraphTextStyleBase)
            .setAlign("center")
            .setOrigin(0.5, 1);

        const blinkingText = this.add
            .text(0, 0, "(Press ENTER to continue)", paragraphTextStyleBase)
            .setAlign("center")
            .setOrigin(0.5, 0);

        this.add.tween({
            targets: blinkingText,
            alpha: 0,
            duration: 1000,
            yoyo: true,
            repeat: -1,
        });
        this.currText.add([content, blinkingText]);
    }
}

export default Tutorial;
