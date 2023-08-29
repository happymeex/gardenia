import Phaser from "phaser";
import playerSpritesheet from "../static/gardenia_spritesheet.png";
import waterfallBackground from "../static/waterfall-bg.jpg";
import platform from "../static/platform.png";
import { loadSettingsIcon, configurePauseMenu } from "../utils";
import { Field, MsgTypes, SpriteSheet } from "../constants";
import { Player, getMotions } from "../Sprites";
import { PlayerBody } from "../SpriteBody";
import { addWaterfallBackground } from "../backgrounds";

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

    public constructor() {
        super({ key: "brawl" });
    }
    preload() {
        loadSettingsIcon(this);
        this.load.image(SpriteSheet.WATERFALL, waterfallBackground);
        this.load.image(SpriteSheet.PLATFORM, platform);
        this.load.spritesheet(SpriteSheet.PLAYER, playerSpritesheet, {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.cursors = this.input.keyboard?.createCursorKeys();
    }
    create(data: { socket: WebSocket; id: string; idList: string[] }) {
        this.isPaused = false; // need to reset this in case this brawl isn't the first one of the sitting
        this.otherPlayers = new Map();
        this.socket = data.socket;
        this.uid = data.id;

        const platforms = addWaterfallBackground(this);

        this.socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg[Field.TYPE] === MsgTypes.SPRITE) {
                if (msg[Field.SOURCE] === this.uid) return;
                const playerBody = this.otherPlayers.get(msg[Field.SOURCE]);
                if (playerBody === undefined) throw new Error();
                const { x, y } = msg[Field.POSITION];
                playerBody.setPosition(x, y);
                playerBody.setAppearance(msg[Field.APPEARANCE]);
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
        data.idList.forEach((id, i) => {
            const x = 300 + 100 * i;
            const y = 300;
            if (id === this.uid) {
                this.player = new Player(id, this, platforms, x, y, () => {}); // TODO: proper onDeath
            } else this.otherPlayers.set(id, new PlayerBody(this, x, y));
        });
    }
    update() {
        if (this.cursors === undefined || this.isPaused) return;
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
