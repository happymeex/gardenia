import Phaser from "phaser";
import waterfallBackground from "../static/waterfall-bg.jpg";
import platform from "../static/platform.png";
import battleTheme from "../static/battle_theme.mp3";
import {
    loadSettingsIcon,
    addPlayerStatusUI,
    loadSprites,
    handleTransformation,
    SpecialKeys,
    createSpecialKeys,
} from "../utils";
import { configurePauseMenu } from "../ui";
import {
    Field,
    MsgTypes,
    SpriteSheet,
    CANVAS_HEIGHT,
    BGM,
    Sound,
} from "../constants";
import { Player, getMotions } from "../Player";
import { PlayerBody } from "../SpriteBody";
import { addWaterfallBackground } from "../backgrounds";
import CombatManager from "../CombatManager";

class Brawl extends Phaser.Scene {
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
    private socket: WebSocket | undefined = undefined;
    /**
     * Id of the browser "process" responsible for pinging the server with this player's
     * sprite position/appearance every N milliseconds. Use this as the argument to clearInterval
     * when the player leaves the scene.
     */
    private spritePinger: number;
    private specialKeys: SpecialKeys;

    public constructor() {
        super({ key: "brawl" });
    }
    preload() {
        loadSettingsIcon(this);
        this.load.audio(Sound.BATTLE, battleTheme);
        this.load.image(SpriteSheet.WATERFALL, waterfallBackground);
        this.load.image(SpriteSheet.PLATFORM, platform);
        loadSprites(this);
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create(data: { socket: WebSocket; id: string; idList: string[] }) {
        BGM.audio.stop();
        BGM.audio = this.sound.add(Sound.BATTLE, { loop: true, volume: 0.7 });
        BGM.audio.play();
        this.isPaused = false; // need to reset this in case this brawl isn't the first one of the sitting
        this.otherPlayers = new Map();
        this.socket = data.socket;
        this.uid = data.id;

        const platforms = addWaterfallBackground(this);
        this.specialKeys = createSpecialKeys(this);

        this.socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
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
            }
        };
        this.socket.onclose = () => {
            clearInterval(this.spritePinger);
        };
        this.spritePinger = setInterval(() => {
            if (this.socket)
                this.socket.send(
                    `data_${JSON.stringify({
                        [Field.SOURCE]: this.uid,
                        [Field.TYPE]: MsgTypes.SPRITE,
                        [Field.POSITION]: this.player.getPosition(),
                        [Field.APPEARANCE]: this.player.getAppearance(),
                    })}`
                );
        }, 30); // 33 fps
        const { pause, resume, leave } = this.makeFlowControlFunctions();
        configurePauseMenu(this, pause, resume, leave);
        const combatManager = new CombatManager();
        data.idList.forEach((id, i) => {
            const x = 300 + 200 * i;
            const y = 300;
            const { setHealthUI, setManaUI, changeIcon } = addPlayerStatusUI(
                this,
                id,
                x,
                CANVAS_HEIGHT - 70
            );
            if (id === this.uid) {
                this.player = new Player(
                    id,
                    this,
                    platforms,
                    x,
                    y,
                    () => {},
                    setHealthUI,
                    setManaUI,
                    changeIcon
                ); // TODO: proper onDeath
                this.player.registerAsCombatant(combatManager, id);
            } else {
                const other = new PlayerBody(
                    id,
                    this,
                    x,
                    y,
                    setHealthUI,
                    setManaUI
                );
                this.otherPlayers.set(id, other);
                combatManager.addParticipant(other, id, (dmg) => {
                    if (this.socket) {
                        this.socket.send(
                            `data_${JSON.stringify({
                                [Field.SOURCE]: this.uid,
                                [Field.TYPE]: MsgTypes.DAMAGE,
                                [Field.TARGET]: id,
                                [Field.VALUE]: dmg,
                            })}`
                        );
                    }
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
                this.physics.pause();
                this.isPaused = true;
            },
            resume: () => {
                this.physics.resume();
                this.isPaused = false;
            },
            leave: () => {
                clearInterval(this.spritePinger);
                if (this.socket) this.socket.close(1000); // indicates normal closure
            },
        };
    }
}

export default Brawl;
