import Phaser from "phaser";
import waterfallBackground from "../static/waterfall-bg.jpg";
import platform from "../static/platform.png";
import {
    loadSettingsIcon,
    addPlayerStatusUI,
    loadSprites,
    handleTransformation,
    SpecialKeys,
    createSpecialKeys,
    BattleScene,
    loadAudio,
    fadeToNextScene,
    showNotification,
} from "../utils";
import {
    makeClickable,
    configurePauseMenu,
    menuTextStyleBase,
    createDarkenedOverlay,
} from "../ui";
import {
    Field,
    MsgTypes,
    SpriteSheet,
    CANVAS_HEIGHT,
    SoundKey,
    CANVAS_WIDTH,
    NullSocket,
    getSpriteMetaData,
    soundTracks,
    Sound,
    CANVAS_CENTER,
} from "../constants";
import { Player, getMotions, Projectile } from "../Player";
import { PlayerBody, SpriteBody } from "../SpriteBody";
import { addWaterfallBackground } from "../backgrounds";
import { CombatManager } from "../CombatManager";
import { BGM } from "../BGM";

const SPRITE_PINGER_PROCESS_NAME = "*sprite-pinger";

class Brawl extends Phaser.Scene implements BattleScene {
    private player: Player;
    /** Object used to read this player's keypress status.*/
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    /** Maps ids to players and their keypress data. */
    private otherPlayers: Map<string, PlayerBody>;
    /** Id of this player. */
    private uid: string;
    /** If true, the game is paused because the menu is open. */
    private isPaused: boolean;
    /** Websocket used to sync game state with server. */
    private socket: WebSocket | NullSocket = new NullSocket();
    private specialKeys: SpecialKeys;
    /** Tracks all projectiles spawned by *other* players. */
    private projectiles: Map<string, SpriteBody> = new Map();
    /**
     * Tracks process numbers created by calls to `setInterval`. Remember to clear them
     * before leaving the scene.
     */
    private processes: Map<string, number> = new Map();
    /** Tracks names of players that are still connected and alive. */
    private livePlayers: Set<string> = new Set();

    public constructor() {
        super({ key: "brawl" });
    }
    preload() {
        loadSettingsIcon(this);
        loadAudio(this, [
            SoundKey.BATTLE,
            SoundKey.WHOOSH,
            SoundKey.DAMAGE,
            SoundKey.EXPLODE,
        ]);
        this.load.image(SpriteSheet.WATERFALL, waterfallBackground);
        this.load.image(SpriteSheet.PLATFORM, platform);
        loadSprites(this);
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create(data: { socket: WebSocket; id: string; idList: string[] }) {
        BGM.play(this, Sound.BATTLE_THEME);
        this.isPaused = false; // need to reset this in case this brawl isn't the first one of the sitting
        this.otherPlayers = new Map();
        this.socket = data.socket;
        this.uid = data.id;
        this.projectiles.clear();
        this.processes.clear();
        this.livePlayers = new Set(data.idList);

        const platforms = addWaterfallBackground(this);
        platforms.create(CANVAS_WIDTH / 2, 230, SpriteSheet.PLATFORM);
        platforms.create(CANVAS_WIDTH / 2 - 300, 420, SpriteSheet.PLATFORM);
        platforms.create(CANVAS_WIDTH / 2 + 300, 420, SpriteSheet.PLATFORM);
        this.specialKeys = createSpecialKeys(this);

        this.socket.onmessage = (e) => {
            const raw = e.data as string;
            if (raw.startsWith("idList")) {
                const idList: string[] = JSON.parse(
                    raw.slice("idList_".length)
                );
                const newLivePlayers = new Set(idList);
                for (const name of this.livePlayers) {
                    if (!newLivePlayers.has(name)) {
                        showNotification(this, `${name} disconnected!`);
                        break;
                    }
                }
                this.livePlayers = newLivePlayers;
                this.checkGameOver();
                return;
            }
            const msg = JSON.parse(raw);
            const type = msg[Field.TYPE];
            const sourceId = msg[Field.SOURCE];
            if (type === MsgTypes.SPRITE) {
                if (sourceId === this.uid) return; // ignore messages from self
                const playerBody = this.otherPlayers.get(sourceId);
                if (playerBody === undefined)
                    throw new Error("Unknown sprite source");
                const { x, y } = msg[Field.POSITION];
                playerBody.setPosition(x, y);
                playerBody.setAppearance(msg[Field.APPEARANCE]);
            } else if (type === MsgTypes.DAMAGE) {
                const targetId = msg[Field.TARGET];
                if (targetId === this.uid) {
                    this.player.takeDamage(msg[Field.VALUE]);
                    this.socket?.send(
                        `data_${JSON.stringify({
                            [Field.SOURCE]: this.uid,
                            [Field.TYPE]: MsgTypes.HEALTH,
                            [Field.VALUE]: this.player.getHealthPercentage(),
                        })}`
                    );
                } else {
                    const target = this.otherPlayers.get(targetId);
                    if (target === undefined)
                        throw new Error("Unknown attack target");
                    target.takeDamage(msg[Field.VALUE]);
                }
            } else if (type === MsgTypes.HEALTH) {
                if (sourceId === this.uid) return;
                const playerBody = this.otherPlayers.get(sourceId);
                if (playerBody === undefined)
                    throw new Error("Unknown health update");
                playerBody.setHealthUI(msg[Field.VALUE]);
            } else if (type === MsgTypes.MANA) {
                if (sourceId === this.uid) return;
                const playerBody = this.otherPlayers.get(sourceId);
                if (playerBody === undefined)
                    throw new Error("Unknown health update");
                playerBody.setManaUI(msg[Field.VALUE]);
            } else if (type === MsgTypes.DEATH) {
                if (sourceId === this.uid) return;
                const playerBody = this.otherPlayers.get(sourceId);
                if (playerBody === undefined)
                    throw new Error("Unknown death update");
                combatManager.removeParticipant(playerBody.name);
                playerBody.remove();
                this.livePlayers.delete(playerBody.name);
                this.checkGameOver();
            } else if (type === MsgTypes.PROJECTILE_CREATE) {
                if (sourceId === this.uid) return;
                const { x, y } = msg[Field.POSITION];
                const projectile = new SpriteBody(
                    msg[Field.NAME],
                    this,
                    getSpriteMetaData(msg[Field.KEY]),
                    [],
                    x,
                    y
                );
                this.projectiles.set(msg[Field.NAME], projectile);
            } else if (type === MsgTypes.PROJECTILE_UPDATE) {
                if (sourceId === this.uid) return;
                const { x, y } = msg[Field.POSITION];
                const projectile = this.projectiles.get(msg[Field.NAME]);
                if (projectile === undefined)
                    throw new Error("projectile not found");
                projectile.setPosition(x, y);
                projectile.setAppearance(msg[Field.APPEARANCE]);
            } else if (type === MsgTypes.PROJECTILE_REMOVE) {
                if (sourceId === this.uid) return;
                const projectile = this.projectiles.get(msg[Field.NAME]);
                if (projectile === undefined)
                    throw new Error("projectile not found");
                this.projectiles.delete(projectile.name);
                projectile.remove();
            } else if (type === MsgTypes.SOUND) {
                if (sourceId === this.uid) return;
                const soundData = soundTracks.get(msg[Field.VALUE]);
                if (soundData === undefined)
                    throw new Error("Sound not found!");
                this.sound.add(soundData.key, soundData.config).play();
            } else if (type === MsgTypes.TRANSFORM) {
                if (sourceId === this.uid) return;
                const playerBody = this.otherPlayers.get(sourceId);
                if (playerBody === undefined)
                    throw new Error("Player not found!");
                playerBody.setIcon(msg[Field.VALUE]);
            }
        };
        this.socket.onclose = () => {
            const spritePinger = this.processes.get(SPRITE_PINGER_PROCESS_NAME);
            if (spritePinger !== undefined) clearInterval(spritePinger);
        };
        const spritePinger = setInterval(() => {
            this.socket.send(
                `data_${JSON.stringify({
                    [Field.SOURCE]: this.uid,
                    [Field.TYPE]: MsgTypes.SPRITE,
                    [Field.POSITION]: this.player.getPosition(),
                    [Field.APPEARANCE]: this.player.getAppearance(),
                })}`
            );
        }, 30); // 33 fps
        this.processes.set(SPRITE_PINGER_PROCESS_NAME, spritePinger);
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configurePauseMenu(this, pause, resume, leave);
        const combatManager = new CombatManager();
        combatManager.setProjectileHandler({
            onUpdate: (projectile: Projectile) =>
                this.socket.send(
                    `data_${JSON.stringify({
                        [Field.TYPE]: MsgTypes.PROJECTILE_UPDATE,
                        [Field.SOURCE]: this.uid,
                        [Field.NAME]: projectile.name,
                        [Field.POSITION]: projectile.getPosition(),
                        [Field.APPEARANCE]: projectile.getAppearance(),
                    })}`
                ),
            onInit: (projectile: Projectile) => {
                this.socket.send(
                    `data_${JSON.stringify({
                        [Field.TYPE]: MsgTypes.PROJECTILE_CREATE,
                        [Field.SOURCE]: this.uid,
                        [Field.NAME]: projectile.name,
                        [Field.KEY]: projectile.spriteKey,
                        [Field.POSITION]: projectile.getPosition(),
                    })}`
                );
            },
            onRemove: (projectile: Projectile) => {
                this.socket.send(
                    `data_${JSON.stringify({
                        [Field.TYPE]: MsgTypes.PROJECTILE_REMOVE,
                        [Field.SOURCE]: this.uid,
                        [Field.NAME]: projectile.name,
                    })}`
                );
            },
        });
        const UIPositions = getStatusUIPositions(data.idList.length);
        data.idList.forEach((id, i) => {
            const { x, y } = UIPositions[i];
            const { setHealthUI, setManaUI, changeIcon } = addPlayerStatusUI(
                this,
                id,
                x,
                y
            );
            if (id === this.uid) {
                this.player = new Player(
                    id,
                    this,
                    platforms,
                    x,
                    400,
                    () => {
                        const spritePinger = this.processes.get(
                            SPRITE_PINGER_PROCESS_NAME
                        );
                        if (spritePinger !== undefined)
                            clearInterval(spritePinger);
                        this.socket.send(
                            `data_${JSON.stringify({
                                [Field.SOURCE]: this.uid,
                                [Field.TYPE]: MsgTypes.DEATH,
                            })}`
                        );
                        this.livePlayers.delete(this.uid);
                        this.checkGameOver();
                    },
                    (ratio) => {
                        this.socket.send(
                            `data_${JSON.stringify({
                                [Field.SOURCE]: this.uid,
                                [Field.TYPE]: MsgTypes.HEALTH,
                                [Field.VALUE]:
                                    this.player.getHealthPercentage(),
                            })}`
                        );
                        setHealthUI(ratio);
                    },
                    (ratio) => {
                        this.socket.send(
                            `data_${JSON.stringify({
                                [Field.SOURCE]: this.uid,
                                [Field.TYPE]: MsgTypes.MANA,
                                [Field.VALUE]: this.player.getManaPercentage(),
                            })}`
                        );
                        setManaUI(ratio);
                    },
                    (target) => {
                        this.socket.send(
                            `data_${JSON.stringify({
                                [Field.SOURCE]: this.uid,
                                [Field.TYPE]: MsgTypes.TRANSFORM,
                                [Field.VALUE]: target,
                            })}`
                        );
                        changeIcon(target);
                    },
                    (sound) => {
                        this.socket.send(
                            `data_${JSON.stringify({
                                [Field.SOURCE]: this.uid,
                                [Field.TYPE]: MsgTypes.SOUND,
                                [Field.VALUE]: sound,
                            })}`
                        );
                    },
                    "right"
                );
                this.player.registerAsCombatant(combatManager, id);
            } else {
                const other = new PlayerBody(
                    id,
                    this,
                    x,
                    y,
                    setHealthUI,
                    setManaUI,
                    changeIcon
                );
                this.otherPlayers.set(id, other);
                combatManager.addParticipant(other, id, (dmg) => {
                    this.socket.send(
                        `data_${JSON.stringify({
                            [Field.SOURCE]: this.uid,
                            [Field.TYPE]: MsgTypes.DAMAGE,
                            [Field.TARGET]: id,
                            [Field.VALUE]: dmg,
                        })}`
                    );
                });
            }
        });
    }
    update() {
        if (this.cursors === undefined || this.isPaused) return;
        handleTransformation(this.player, this.specialKeys);
        const keysPressed = getMotions(this.cursors);
        this.player.handleMotion(keysPressed);
    }

    /**
     * Creates handler functions to be run when pausing, resuming, and leaving the scene.
     * Specifically: pausing/resuming the physics engine, toggling `this.isPause`,
     * and closing the websocket connection if leaving.
     *
     * @returns Object whose values are the appropriate pause and resume functions
     */
    private makeFlowControlFunctions() {
        return {
            pause: () => {
                // Allow users to open pause menu but make the game continue in the background
                //this.physics.pause();
                //this.isPaused = true;
            },
            resume: () => {
                //this.physics.resume();
                //this.isPaused = false;
            },
            leave: () => {
                for (const processNumber of this.processes.values())
                    clearInterval(processNumber);
                this.socket.close(1000); // indicates normal closure
                this.game.input.keyboard?.clearCaptures();
            },
        };
    }

    public getIsPaused() {
        return this.isPaused;
    }

    /**
     * Adds a process number (created by a call to `setInterval`) to the scene's
     * internal process tracker, associating it with the key `processName`.
     */
    public addProcess(processName: string, process: number): void {
        this.processes.set(processName, process);
    }

    /**
     * Checks if there is only a single living player left. If so, waits 2 seconds
     * and then initiates the game over screen.
     */
    private checkGameOver(): void {
        if (this.livePlayers.size === 1) {
            setTimeout(() => {
                this.gameOver(Array.from(this.livePlayers)[0]);
            }, 2000);
        }
    }

    /**
     * Pauses the game, and displays a screen saying "Winner: {victor}"
     * and a button that takes the user back to the main menu.
     */
    private gameOver(victor: string): void {
        this.isPaused = true;
        createDarkenedOverlay(this);
        const container = this.add.container(...CANVAS_CENTER);
        const header = this.add.text(0, -100, `Winner: ${victor}`, {
            ...menuTextStyleBase,
            fontSize: "96px",
        });
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
            [header, returnToMenu].map((item) => item.setOrigin(0.5))
        );
        container.setDepth(100);
    }
}

/**
 * Returns the coordinates of the icon/health/mana UI statuses of the brawl players.
 *
 * @param numPlayers Assumed to be 2 or 3.
 */
function getStatusUIPositions(numPlayers: number): { x: number; y: number }[] {
    const y = CANVAS_HEIGHT - 70;
    if (numPlayers === 2) {
        const xs = [CANVAS_WIDTH / 2 - 250, CANVAS_WIDTH / 2 + 250];
        return xs.map((x) => ({ x, y }));
    }
    if (numPlayers === 3) {
        const xs = [
            CANVAS_WIDTH / 2 - 350,
            CANVAS_WIDTH / 2,
            CANVAS_WIDTH / 2 + 350,
        ];
        return xs.map((x) => ({ x, y }));
    }
    throw new Error(`Unexpected number of players: ${numPlayers}`);
}

export default Brawl;
